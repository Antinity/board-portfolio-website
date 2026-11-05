import { education } from "@/data/content";
import { BoardItem, IndexCard, Paper, Stamp, TypedHeading } from "@/components/evidence";
import { Entry } from "@/components/case-file/FileParts";

export function EducationEvidence() {
  const [main, ...rest] = education;
  return (
    <>
      {main && (
        <BoardItem x={40} y={80} w={360} rotate={-2} tape>
          <Paper>
            <TypedHeading>Records</TypedHeading>
            <div style={{ fontFamily: "var(--font-display)", fontSize: 24, textTransform: "uppercase" }}>{main.title}</div>
            <div>{main.institution}</div>
            <div style={{ opacity: 0.65 }}>{main.period}</div>
            <div style={{ marginTop: 14 }}>
              <Stamp color="#2a5fc4" rotate={-10}>
                Verified
              </Stamp>
            </div>
          </Paper>
        </BoardItem>
      )}
      {rest.slice(0, 2).map((item, i) => (
        <BoardItem key={item.id} x={440 + i * 30} y={110 + i * 60} w={260} rotate={i ? -3 : 4} pin="green" z={2 + i}>
          <IndexCard title={item.period}>
            <strong>{item.title}</strong>
            <br />
            {item.institution}
          </IndexCard>
        </BoardItem>
      ))}
    </>
  );
}

export function EducationFile() {
  return education.map((item) => (
    <Entry key={item.id} kicker={item.period} title={item.title} subtitle={item.institution}>
      <p>{item.note}</p>
    </Entry>
  ));
}
