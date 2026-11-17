import { act, render, screen } from "@testing-library/react";
import { setStreamSnapshotForTests } from "@/lib/stream/useStreamStatus";
import { OFFLINE_STATUS, type PublicStatus } from "@/lib/stream/state";
import { siteConfig } from "@/utils/app.constants";
import { HeroLiveCta } from "./HeroLiveCta";
import { LivePill } from "./LivePill";
import { NowPlaying } from "./NowPlaying";

const NOW = Date.UTC(2026, 10, 17, 12, 0);

function setStatus(patch: Partial<PublicStatus> | null) {
  act(() =>
    setStreamSnapshotForTests(
      patch ? { status: { ...OFFLINE_STATUS, ...patch }, at: NOW } : null,
    ),
  );
}

describe("live status on the website", () => {
  afterEach(() => setStatus(null));

  it("shows where the lives happen until the status says live", () => {
    render(<LivePill />);
    expect(screen.getByRole("link")).toHaveAttribute("href", siteConfig.links.tiktokLive);
    setStatus({ live: true, source: "twitch" });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", siteConfig.links.twitch);
    expect(link).toHaveTextContent("Live now · Twitch");
  });

  it("points the hero button at Twitch while live", () => {
    render(<HeroLiveCta className="" />);
    expect(screen.getByRole("link")).toHaveTextContent("Watch the lives");
    setStatus({ live: true, source: "manual" });
    expect(screen.getByRole("link")).toHaveTextContent("Watch live now");
  });

  it("shows game and topic while live, the next stream while offline", () => {
    const { container } = render(<NowPlaying />);
    expect(container).toHaveTextContent("Now playing");
    expect(container).toHaveTextContent("FIFA · RP · Story mode");
    setStatus({ live: true, source: "twitch", game: "RDR2", topic: "Story mode" });
    expect(container).toHaveTextContent("RDR2 · Story mode");
    setStatus({ next: { at: NOW + 2 * 24 * 3600 * 1000, plan: "FIFA night" } });
    expect(container).toHaveTextContent("Next stream");
    expect(container).toHaveTextContent(/· FIFA night$/);
  });
});
