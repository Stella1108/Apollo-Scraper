import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const { url, leadsCount, fileName, fileFormat } = await request.json();

    if (!url || !leadsCount) {
      return NextResponse.json({ message: "Missing url or leadsCount" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("scraper_requests")
      .insert({
        url,
        leads_count: leadsCount,
        file_name: fileName || `scrape_results.${fileFormat || "csv"}`,
        file_format: fileFormat,
        status: "pending",
        requested: leadsCount,
        extracted: 0,
        credits: leadsCount,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ message: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: any) {
    return NextResponse.json({ message: err.message || "Internal Server Error" }, { status: 500 });
  }
}
