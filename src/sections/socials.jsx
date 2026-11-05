import { socials } from "@/data/content";
import { BoardItem, Polaroid } from "@/components/evidence";
import { Entry, ExternalLink } from "@/components/case-file/FileParts";

const CARD_W = 150;

export function SocialsEvidence({ section }) {
  const items = socials.slice(0, 4);
  const step = (section.bounds.w - 120 - CARD_W) / Math.max(items.length - 1, 1);

  return items.map((social, i) => (
    <BoardItem key={social.id} x={30 + i * step} y={90 + (i % 2) * 40} w={CARD_W} rotate={[-4, 3, -2, 5][i % 4]} pin="black">
      <Polaroid variant="badge" seed={social.id} label={social.label} caption={social.label} />
    </BoardItem>
  ));
}

export function SocialsFile() {
  return socials.map((social) => (
    <Entry key={social.id} title={social.label} subtitle={social.handle}>
      <ExternalLink href={social.url}>{social.url}</ExternalLink>
    </Entry>
  ));
}
