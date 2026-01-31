export async function GET({ url }: { url: string }) {
    const u = new URL(url);
    const params = u.searchParams;

    const targetUrl = params.get("url");

    if (!targetUrl) {
        return new Response("Missing url", { status: 400 });
    }

    // Convert share → embed
    const embedUrl = targetUrl.replace("/share/", "/embed/");

    const response = {
        type: "rich",
        version: "1.0",
        provider_name: "TimeCapsule",
        provider_url: "https://timecapsule.srirams.me",
        title: "TimeCapsule Timeline",
        html: `<iframe src="${embedUrl}" width="100%" height="600" frameborder="0" allowfullscreen></iframe>`,
        width: 600,
        height: 600,
    };

    return new Response(JSON.stringify(response), {
        headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
    });
}
