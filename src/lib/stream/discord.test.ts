import { discordMessage, isWebhookUrl, tiktokLiveUrl } from "./discord";

describe("discord ping", () => {
  it("accepts only Discord webhook URLs", () => {
    expect(isWebhookUrl("https://discord.com/api/webhooks/123456/abc-DEF_1")).toBe(true);
    expect(isWebhookUrl("https://discordapp.com/api/webhooks/123456/abc")).toBe(true);
    expect(isWebhookUrl("https://evil.com/api/webhooks/1/a")).toBe(false);
    expect(isWebhookUrl(undefined)).toBe(false);
  });

  it("pings only the Live Ping role and links the right account", () => {
    const body = discordMessage({ topic: "@everyone FIFA", game: "FIFA" }, "live", "1234567890");
    expect(body.content).toBe("<@&1234567890> we're LIVE on TikTok 🔴");
    expect(body.allowed_mentions).toEqual({ parse: [], roles: ["1234567890"] });
    expect(body.embeds[0]).toMatchObject({
      title: "@everyone FIFA",
      description: "FIFA · on @clipzhub06",
      url: "https://www.tiktok.com/@clipzhub06/live",
    });
    expect(tiktokLiveUrl("main")).toBe("https://www.tiktok.com/@madnco8/live");
  });

  it("works without a role or topic", () => {
    const body = discordMessage({ topic: "", game: "" }, "main", "not-a-number");
    expect(body.content).toBe("we're LIVE on TikTok 🔴");
    expect(body.allowed_mentions.roles).toEqual([]);
    expect(body.embeds[0].description).toBe("on @madnco8");
  });
});
