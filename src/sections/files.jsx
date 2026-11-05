/* eslint-disable @next/next/no-img-element -- small static evidence images, no optimisation needed */
import { contact, experience, operations, projects, socials, stack, subject, witnesses } from "@/data/content";
import { Bullets, Entry, ExternalLink, FieldList, FileBlock, Prose, TagList } from "@/components/case-file/FileParts";
import styles from "@/components/case-file/fileParts.module.css";

/* Expanded case-file content for each section. */

export function SubjectFile() {
  return (
    <>
      <div className={styles.split}>
        <img className={styles.photo} src={subject.photo} alt={`${subject.photoCaption} of ${subject.alias}`} />
        <FieldList
          fields={[
            { label: "Name", value: subject.name },
            { label: "Alias", value: subject.alias },
            { label: "Age", value: subject.age },
            { label: "Origin", value: subject.origin },
            { label: "Timezone", value: subject.timezone },
            { label: "Active since", value: subject.activeSince },
            { label: "Occupation", value: subject.role },
          ]}
        />
      </div>
      <FileBlock title="Notes">
        <Prose>
          {subject.bio.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </Prose>
      </FileBlock>
      <FileBlock title="Known traits">
        <TagList items={subject.traits} />
      </FileBlock>
    </>
  );
}

export function JobsFile() {
  return projects.map((p) => (
    <Entry
      key={p.id}
      kicker={p.kind}
      title={p.title}
      aside={<img className={styles.shot} src={p.image} alt={`${p.title} screenshot`} loading="lazy" />}
    >
      <p>{p.summary}</p>
      <TagList items={p.stack} />
      <ExternalLink href={p.url}>Visit site →</ExternalLink>
    </Entry>
  ));
}

export function TodoFile() {
  const groups = [
    { title: "Currently building", items: operations.filter((o) => !o.done) },
    { title: "Shipped", items: operations.filter((o) => o.done) },
  ];
  return groups.map((g) => (
    <FileBlock key={g.title} title={g.title}>
      {g.items.map((op) => (
        <Entry key={op.id} kicker={op.done ? "✓ Done" : "☐ In progress"} title={op.title}>
          <p>{op.summary}</p>
          <ExternalLink href={op.url}>{op.url.replace(/^https?:\/\//, "")}</ExternalLink>
        </Entry>
      ))}
    </FileBlock>
  ));
}

export function ApproachFile() {
  return (
    <>
      <Prose>
        <p>{subject.bio[2]}</p>
      </Prose>
      {stack.map((g) => (
        <FileBlock key={g.group} title={g.group}>
          <TagList items={g.items} />
        </FileBlock>
      ))}
    </>
  );
}

export function WitnessesFile() {
  return witnesses.map((w) => (
    <Entry key={w.id} kicker={`${w.role} · ${w.org}`} title={w.name}>
      <blockquote className={styles.quote}>“{w.statement}”</blockquote>
    </Entry>
  ));
}

export function RecordFile() {
  return experience.map((job) => (
    <Entry key={job.id} kicker={job.period ?? "Dates on request"} title={job.role} subtitle={job.company}>
      <p>{job.summary}</p>
      <Bullets items={job.highlights} />
      {job.url && <ExternalLink href={job.url}>{job.url.replace(/^https?:\/\//, "")}</ExternalLink>}
    </Entry>
  ));
}

export function ContactFile() {
  return (
    <>
      <Prose>
        <p>{contact.note} Based in India — replies in {contact.timezone}.</p>
      </Prose>
      <FileBlock title="Tip line">
        <FieldList
          fields={[
            { label: "Email", value: <ExternalLink href={`mailto:${contact.email}`}>{contact.email}</ExternalLink> },
            ...socials.map((s) => ({ label: s.label, value: <ExternalLink href={s.url}>{s.handle}</ExternalLink> })),
          ]}
        />
      </FileBlock>
    </>
  );
}
