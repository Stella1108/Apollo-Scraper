import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

const AMPLELEADS_API_KEY = process.env.AMPLELEADS_API_KEY;

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { url, leadsCount, fileName, fileFormat } = await request.json();

    if (!url || !leadsCount) {
      return NextResponse.json(
        { message: "Missing url or leadsCount" },
        { status: 400 }
      );
    }

    if (!AMPLELEADS_API_KEY) {
      console.error("AmpleLeads API key is missing in environment variables");
      return NextResponse.json(
        { message: "Server error: missing API key" },
        { status: 500 }
      );
    }

    const format = fileFormat === "xlsx" ? "xlsx" : "csv";
    const finalFileName = fileName || `scrape_results.${format}`;

    const { data: requestData, error: insertError } = await supabase
      .from("scraper_requests")
      .insert({
        url,
        leads_count: leadsCount,
        file_name: finalFileName,
        file_format: format,
        status: "pending",
        requested: leadsCount,
        extracted: 0,
        credits: leadsCount,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Supabase insert error:", insertError);
      return NextResponse.json(
        { message: insertError.message },
        { status: 500 }
      );
    }

    let extractedCount = 0;
    let downloadLink: string | null = null;
    let scrapeError: string | null = null;

    try {
      const apiResponse = await fetch(
        `https://api.ampleleads.io/v1/apollo/scrape?api_key=${AMPLELEADS_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            apollo_url: url,
  fetch_count: Math.min(Math.max(leadsCount, 100), 50000),  // clamps the number to [100, 50000]
  file_format: format,
          }),
        }
      );

      if (!apiResponse.ok) {
        // Attempt to extract detailed error from response
        const errorJson = await apiResponse.json().catch(() => null);
        const errorMessage = errorJson ? JSON.stringify(errorJson) : "Unknown error";
        throw new Error(`AmpleLeads API Error: ${apiResponse.status} - ${errorMessage}`);
      }

      const result = await apiResponse.json();
      extractedCount = result.extractedLeadsCount || 0;
      downloadLink = result.downloadUrl || null;
    } catch (err: any) {
      scrapeError = err.message || "AmpleLeads scraping failed";
      console.error("AmpleLeads API error detail:", scrapeError);
    }

    await supabase
      .from("scraper_requests")
      .update({
        status: scrapeError ? "failed" : "completed",
        extracted: extractedCount,
        download_link: downloadLink,
      })
      .eq("id", requestData.id);

    if (scrapeError)
      return NextResponse.json({ message: scrapeError }, { status: 500 });

    return NextResponse.json({
      ...requestData,
      status: "completed",
      extracted: extractedCount,
      download_link: downloadLink,
    });
  } catch (error: any) {
    console.error("Unexpected error:", error);
    return NextResponse.json(
      { message: error.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
