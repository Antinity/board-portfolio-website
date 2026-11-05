import { projects } from "@/data/content";
import { BoardItem, Polaroid, Snapshot, StickyNote } from "@/components/evidence";
import { Entry, ExternalLink, TagList } from "@/components/case-file/FileParts";

const PHOTO_W = 230;

export function ProjectsEvidence({ section }) {
  const items = projects.slice(0, 4);
  const step = (section.bounds.w - 60 - PHOTO_W) / Math.max(items.length - 1, 1);

  return items.map((project, i) => {
    const x = 30 + i * step;
    const y = 130 + (i % 2 ? 50 : 0);
    return (
      <div key={project.id}>
        <BoardItem x={x} y={y} w={PHOTO_W} rotate={i % 2 ? 3.5 : -3} pin={i % 2 ? "green" : "red"}>
          <Polaroid variant="scene" ratio={1.2} src={project.image} seed={project.id} caption={project.year} />
        </BoardItem>
        <BoardItem x={x + 90} y={y + 250} w={160} rotate={i % 2 ? -6 : 7} z={2} tape={i % 2 ? 4 : -4}>
          <StickyNote color={i % 2 ? "pink" : "yellow"} style={{ fontSize: 20, padding: "18px 14px" }}>
            {project.title}
          </StickyNote>
        </BoardItem>
      </div>
    );
  });
}

export function ProjectsFile() {
  return projects.map((project) => (
    <Entry
      key={project.id}
      kicker={`${project.year} · ${project.role}`}
      title={project.title}
      aside={
        <div style={{ margin: "6px 0 14px" }}>
          <Snapshot variant="scene" ratio={16 / 9} src={project.image} seed={project.id} alt={project.title} />
        </div>
      }
    >
      <p>
        <strong>{project.summary}</strong>
      </p>
      <p>{project.description}</p>
      <TagList items={project.stack} />
      {project.link && <ExternalLink href={project.link}>View project →</ExternalLink>}
    </Entry>
  ));
}
