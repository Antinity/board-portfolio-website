import { contact, socials, subject } from "@/data/content";

/*
 * Transcripts: the text of each kind of evidence, given to screen readers
 * while a page is held up (and used for the accessible list of documents).
 * Each receives the board item and returns { title, body }.
 */

const Link = ({ href, children }) => (
  <a href={href} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const bare = (url) => url.replace(/^https?:\/\//, "").replace(/\/$/, "");

const Fields = ({ rows }) => (
  <dl>
    {rows.map(([k, v]) => (
      <div key={k}>
        <dt>{k}</dt>
        <dd>{v}</dd>
      </div>
    ))}
  </dl>
);

const TRANSCRIPTS = {
  poster: () => ({
    title: subject.name,
    body: (
      <>
        <p>
          Hey, I&apos;m {subject.firstName} — {subject.role}. {subject.headline.join(" ")}
        </p>
        <p>{subject.intro}</p>
      </>
    ),
  }),

  polaroid: () => ({
    title: subject.name,
    body: <p>Polaroid of {subject.name} ({subject.alias}), pinned to the centre of the board.</p>,
  }),

  dossier: () => ({
    title: "Subject file",
    body: (
      <>
        <Fields
          rows={[
            ["Name", subject.name],
            ["Alias", subject.alias],
            ["Age", subject.age],
            ["Origin", subject.origin],
            ["Timezone", subject.timezone],
            ["Active since", subject.activeSince],
            ["Occupation", subject.role],
          ]}
        />
        {subject.bio.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </>
    ),
  }),

  sticky: (item) => ({
    title: "Sticky note",
    body: <p>{item.props.text.replace(/\n/g, " ")}</p>,
  }),

  print: ({ props: { work } }) => ({
    title: work.title,
    body: (
      <>
        <p>
          {work.location} · {work.services} · {work.year}
        </p>
        {work.summary && <p>{work.summary}</p>}
        {work.url && (
          <p>
            <Link href={work.url}>{bare(work.url)}</Link>
          </p>
        )}
      </>
    ),
  }),

  todo: ({ props: { items } }) => ({
    title: "To do",
    body: [
      ["Currently building", items.filter((o) => !o.done)],
      ["Shipped", items.filter((o) => o.done)],
    ].map(([heading, list]) => (
      <section key={heading}>
        <h3>{heading}</h3>
        {list.map((op) => (
          <div key={op.id}>
            <h4>
              <Link href={op.url}>{op.title}</Link>
            </h4>
            <p>{op.summary}</p>
          </div>
        ))}
      </section>
    )),
  }),

  tag: ({ props: { group } }) => ({
    title: `Evidence — ${group.group}`,
    body: (
      <ul>
        {group.items.map((i) => (
          <li key={i}>{i}</li>
        ))}
      </ul>
    ),
  }),

  crew: ({ props: { witness } }) => ({
    title: `Statement — ${witness.name}`,
    body: (
      <>
        <p>
          {witness.role}, {witness.org}
        </p>
        <blockquote>“{witness.statement}”</blockquote>
      </>
    ),
  }),

  indexcard: ({ props: { job } }) => ({
    title: job.role,
    body: (
      <>
        <p>
          {job.company} · {job.period ?? "dates on request"}
        </p>
        <p>{job.summary}</p>
        <ul>
          {job.highlights.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        {job.url && (
          <p>
            <Link href={job.url}>{bare(job.url)}</Link>
          </p>
        )}
      </>
    ),
  }),

  contactcard: () => ({
    title: contact.note,
    body: (
      <>
        <p>
          <Link href={`mailto:${contact.email}`}>{contact.email}</Link>
        </p>
        <Fields rows={socials.filter((s) => s.url).map((s) => [s.label, <Link key={s.id} href={s.url}>{s.handle}</Link>])} />
        <p>Replies in {contact.timezone}.</p>
      </>
    ),
  }),

  social: ({ props: { social } }) => ({
    title: social.label,
    body: <p>{social.url ? <Link href={social.url}>{social.handle}</Link> : "Link coming soon."}</p>,
  }),
};

export function transcriptFor(item) {
  return TRANSCRIPTS[item.kind]?.(item) ?? { title: item.id, body: null };
}
