import styles from "./fileParts.module.css";

/* Small building blocks for the expanded case-file views. */

export function FileBlock({ title, children }) {
  return (
    <section className={styles.block}>
      {title && <h3 className={styles.blockTitle}>{title}</h3>}
      {children}
    </section>
  );
}

/** @param {{ label: string, value: React.ReactNode }[]} fields */
export function FieldList({ fields }) {
  return (
    <dl className={styles.fields}>
      {fields.map(({ label, value }) => (
        <div key={label} className={styles.field}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function TagList({ items }) {
  return (
    <ul className={styles.tags}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

/** A dated record: job, degree, project... */
export function Entry({ kicker, title, subtitle, children, aside }) {
  return (
    <article className={styles.entry}>
      <div className={styles.entryHead}>
        {kicker && <span className={styles.kicker}>{kicker}</span>}
        <h4 className={styles.entryTitle}>{title}</h4>
        {subtitle && <span className={styles.subtitle}>{subtitle}</span>}
      </div>
      {aside}
      <div className={styles.entryBody}>{children}</div>
    </article>
  );
}

export function Bullets({ items }) {
  return (
    <ul className={styles.bullets}>
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

export function ExternalLink({ href, children }) {
  return (
    <a className={styles.link} href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

export function Prose({ children }) {
  return <div className={styles.prose}>{children}</div>;
}
