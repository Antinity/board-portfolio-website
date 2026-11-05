import { skills } from "@/data/content";
import { BoardItem, Paper, StickyNote, TypedHeading } from "@/components/evidence";
import { FileBlock, TagList } from "@/components/case-file/FileParts";

const NOTE_COLORS = ["yellow", "pink", "green", "blue", "orange"];
const SLOTS = [
  { x: 30, y: 210, r: -5 },
  { x: 260, y: 190, r: 4 },
  { x: 40, y: 450, r: 3 },
  { x: 265, y: 470, r: -4 },
];

export function SkillsEvidence() {
  return (
    <>
      <BoardItem x={60} y={70} w={380} rotate={1.5} tape>
        <Paper style={{ padding: "22px 24px" }}>
          <TypedHeading>Evidence inventory</TypedHeading>
          <span style={{ fontSize: 14 }}>Items recovered: {skills.reduce((n, g) => n + g.items.length, 0)}</span>
        </Paper>
      </BoardItem>

      {skills.slice(0, SLOTS.length).map((group, i) => (
        <BoardItem key={group.group} x={SLOTS[i].x} y={SLOTS[i].y} w={205} rotate={SLOTS[i].r} pin="red" z={2}>
          <StickyNote color={NOTE_COLORS[i % NOTE_COLORS.length]} style={{ minHeight: 205 }}>
            <u>{group.group}</u>
            <div style={{ fontFamily: "var(--font-hand)", fontSize: 25, lineHeight: 1.1, marginTop: 8 }}>
              {group.items.map((item) => (
                <div key={item}>{item}</div>
              ))}
            </div>
          </StickyNote>
        </BoardItem>
      ))}
    </>
  );
}

export function SkillsFile() {
  return skills.map((group) => (
    <FileBlock key={group.group} title={group.group}>
      <TagList items={group.items} />
    </FileBlock>
  ));
}
