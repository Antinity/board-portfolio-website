import { caseInfo, profile } from "@/data/content";
import { BoardItem, Clipping, Paper, Polaroid, Snapshot, StickyNote, TypedHeading, TypedRow } from "@/components/evidence";
import { FieldList, FileBlock, Prose, TagList } from "@/components/case-file/FileParts";

export function ProfileEvidence() {
  return (
    <>
      <BoardItem x={40} y={90} w={270} rotate={-4} pin="red">
        <Polaroid variant="mugshot" ratio={0.85} src={profile.image} seed="me" label={`No. ${caseInfo.caseNumber}`} caption={caseInfo.name} />
      </BoardItem>

      <BoardItem x={340} y={70} w={390} rotate={2} tape>
        <Paper>
          <TypedHeading>Dossier</TypedHeading>
          <TypedRow label="Name">{caseInfo.name}</TypedRow>
          <TypedRow label="Alias">{profile.alias}</TypedRow>
          <TypedRow label="Occupation">{profile.occupation}</TypedRow>
          <TypedRow label="Location">{profile.location}</TypedRow>
          <TypedRow label="Status">{profile.status}</TypedRow>
        </Paper>
      </BoardItem>

      <BoardItem x={70} y={470} w={220} rotate={-7} pin="yellow" z={2}>
        <StickyNote>Who is {caseInfo.name}?</StickyNote>
      </BoardItem>

      <BoardItem x={340} y={395} w={390} rotate={-2} pin="blue">
        <Clipping date={caseInfo.opened} headline={`${profile.occupation} spotted`}>
          {profile.summary.join(" ")}
        </Clipping>
      </BoardItem>
    </>
  );
}

export function ProfileFile() {
  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 180px) 1fr", gap: 24, alignItems: "start" }}>
        <Snapshot variant="mugshot" ratio={0.8} src={profile.image} seed="me" label={`No. ${caseInfo.caseNumber}`} alt={caseInfo.name} />
        <FieldList
          fields={[
            { label: "Name", value: caseInfo.name },
            { label: "Alias", value: profile.alias },
            { label: "Occupation", value: profile.occupation },
            { label: "Location", value: profile.location },
            { label: "Languages", value: profile.languages },
            { label: "Status", value: profile.status },
          ]}
        />
      </div>
      <FileBlock title="Statement">
        <Prose>
          {profile.summary.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </FileBlock>
      <FileBlock title="Known traits">
        <TagList items={profile.traits} />
      </FileBlock>
    </>
  );
}
