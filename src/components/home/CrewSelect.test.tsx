import { fireEvent, render, screen } from "@testing-library/react";
import { en } from "@/locales/en";
import { CrewSelect } from "./CrewSelect";
import { crewOrder, crewScheme } from "./crew.content";

describe("CrewSelect", () => {
  it("starts on Mad and switches the bio when another fighter is picked", () => {
    render(<CrewSelect text={en.crew} />);
    const [mad, co] = screen.getAllByRole("button");

    expect(mad).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(en.crew.members.mad.blurb)).toBeInTheDocument();

    fireEvent.click(co);

    expect(co).toHaveAttribute("aria-pressed", "true");
    expect(mad).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByText(en.crew.members.co.blurb)).toBeInTheDocument();
    expect(screen.queryByText(en.crew.members.mad.blurb)).not.toBeInTheDocument();
  });

  it("lists the picked fighter's games", () => {
    render(<CrewSelect text={en.crew} />);
    fireEvent.click(screen.getAllByRole("button")[2]);
    const list = screen.getByRole("list");
    for (const game of en.crew.members.guest.plays) expect(list).toHaveTextContent(game);
  });
});

describe("crew content", () => {
  it("has text for every crew member", () => {
    for (const id of crewOrder) expect(en.crew.members[id].name).toBeTruthy();
  });

  it("splits screen time between the hosts, with the guest slot open", () => {
    expect(crewScheme.mad.share + crewScheme.co.share).toBeCloseTo(1);
    expect(crewScheme.guest.share).toBe(0);
  });
});
