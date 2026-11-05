import { caseInfo, contact } from "@/data/content";
import { BoardItem, Paper, Stamp } from "@/components/evidence";
import { ExternalLink, FieldList, FileBlock, Prose } from "@/components/case-file/FileParts";

export function ContactEvidence() {
  return (
    <>
      <BoardItem x={40} y={80} w={400} rotate={-1.5} pin="red">
        <Paper style={{ textAlign: "center", padding: "36px 26px 30px" }}>
          <div style={{ fontFamily: "var(--font-display)", fontSize: 56, fontWeight: 700, lineHeight: 0.95, letterSpacing: "0.04em" }}>
            HAVE
            <br />
            INFORMATION?
          </div>
          <div style={{ marginTop: 16, fontSize: 15 }}>If you have a project for {caseInfo.firstName}, call the tip line.</div>
          <div style={{ marginTop: 18 }}>
            <Stamp rotate={-6}>Reward</Stamp>
          </div>
        </Paper>
      </BoardItem>

      <BoardItem x={70} y={420} w={350} rotate={3} pin="blue" z={2}>
        <Paper variant="lined" torn>
          <div>{contact.email}</div>
          <div>{contact.phone}</div>
          <div>{contact.location}</div>
          <div style={{ color: "#b3262e" }}>call anytime!</div>
        </Paper>
      </BoardItem>
    </>
  );
}

export function ContactFile() {
  return (
    <>
      <Prose>
        <p>{contact.note}</p>
      </Prose>
      <FileBlock title="Tip line">
        <FieldList
          fields={[
            { label: "Email", value: <ExternalLink href={`mailto:${contact.email}`}>{contact.email}</ExternalLink> },
            { label: "Phone", value: <ExternalLink href={`tel:${contact.phone.replace(/\s/g, "")}`}>{contact.phone}</ExternalLink> },
            { label: "Location", value: contact.location },
            { label: "Availability", value: contact.availability },
          ]}
        />
      </FileBlock>
    </>
  );
}
