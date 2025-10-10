import { ApifyClient } from 'apify-client';
import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

const APIFY_API_TOKEN = process.env.APIFY_API_TOKEN!;
const ACTOR_ID = "pipelinelabs~lead-scraper-apollo-zoominfo-lusha";

function isFilteredApolloUrl(url: string) {
  return url.startsWith("https://app.apollo.io/#/people");
}

export async function POST(request: NextRequest) {
  try {
    const { url, leadsCount, fileName, fileFormat = "csv", hasEmail, hasPhone } = await request.json();

    if (!url || !leadsCount) {
      return NextResponse.json({ message: "Missing url or leadsCount" }, { status: 400 });
    }
    if (!isFilteredApolloUrl(url)) {
      return NextResponse.json({ message: "Invalid Apollo.io People search URL." }, { status: 400 });
    }

    // Ensure file_format matches the allowed values
    const format = (fileFormat && ["csv", "xlsx"].includes(fileFormat)) ? fileFormat : "csv";
    const finalFileName = fileName?.trim() || `scrape_results.${format}`;

    // Insert scrape request as pending with credits equal to lead count
    const { data: requestData, error: insertError } = await supabaseAdmin
      .from("scraper_requests")
      .insert({
        url,
        leads_count: Number(leadsCount),
        file_name: finalFileName,
        file_format: format,
        status: "pending",
        requested: Number(leadsCount),
        extracted: 0,
        credits: Number(leadsCount),
        error_message: null,
      })
      .select()
      .single();

    if (insertError || !requestData) {
      return NextResponse.json({ message: insertError?.message || "Failed to record scrape request" }, { status: 500 });
    }

    const client = new ApifyClient({ token: APIFY_API_TOKEN });
    const input = {
      apollo_url: url,
      totalResults: Number(leadsCount),
      hasEmail: hasEmail ?? false,
      hasPhone: hasPhone ?? false
    };

    let run;
    try {
      run = await client.actor(ACTOR_ID).call(input);
    } catch (startError) {
      await supabaseAdmin.from("scraper_requests").update({
        status: "failed",
        error_message: (startError as Error).message,
      }).eq("id", requestData.id);
      return NextResponse.json({ message: "Failed to start scrape run", details: (startError as Error).message }, { status: 500 });
    }

    // Fetch results from the run dataset
    let items = [];
    try {
      const result = await client.dataset(run.defaultDatasetId).listItems();
      items = result.items;
    } catch (exportError) {
      await supabaseAdmin.from("scraper_requests").update({
        status: "failed",
        error_message: JSON.stringify(exportError) || "Failed to export scrape results"
      }).eq("id", requestData.id);
      return NextResponse.json({ message: "Failed to export scrape results", details: exportError }, { status: 500 });
    }

    // Map and insert leads
    const leadsToInsert = (items || []).map((lead: any) => ({
      job_id: requestData.id,
      name: lead.name ?? null,
      title: lead.title ?? null,
      company: lead.company ?? null,
      email: lead.email ?? null,
      phone: lead.phone ?? null,
      location: lead.location ?? null,
      linkedin_url: lead.linkedinUrl ?? null,
      company_website: lead.companyWebsite ?? null,
      industry: lead.industry ?? null,
      company_size: lead.companySize ?? null,
    }));

    if (leadsToInsert.length > 0) {
      await supabaseAdmin.from("scraper_leads").insert(leadsToInsert);
    }

    // Update request as completed
    await supabaseAdmin.from("scraper_requests").update({
      status: "completed",
      extracted: leadsToInsert.length,
      error_message: null,
    }).eq("id", requestData.id);

    return NextResponse.json({
      id: requestData.id,
      extracted: leadsToInsert.length,
      results: items,
    });
  } catch (error) {
    console.error("Scrape POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
