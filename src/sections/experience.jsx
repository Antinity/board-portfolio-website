import { experience } from "@/data/content";
import { Blueprint, BoardItem, IndexCard } from "@/components/evidence";
import { Bullets, Entry } from "@/components/case-file/FileParts";

const CARD_W = 220;

export function ExperienceEvidence({ section }) {
  const { w } = section.bounds;
  const jobs = experience.slice(0, 4);
  const gap = (w - 80 - CARD_W * jobs.length) / Math.max(jobs.length - 1, 1);

  return (
    <>
      <BoardItem x={0} y={60} w={w} h={480} rotate={-0.6} pin="white">
        <Blueprint title="Work history" />
      </BoardItem>

      {jobs.map((job, i) => (
        <BoardItem
          key={job.id}
          x={40 + i * (CARD_W + gap)}
          y={130 + (i % 2) * 70}
          w={CARD_W}
          rotate={i % 2 ? 3 : -2.5}
          pin={i % 2 ? "yellow" : "red"}
          z={2}
        >
          <IndexCard title={job.period}>
            <strong>{job.role}</strong>
            <br />
            {job.company}
            <br />
            <span style={{ opacity: 0.6 }}>{job.location}</span>
          </IndexCard>
        </BoardItem>
      ))}
    </>
  );
}

export function ExperienceFile() {
  return experience.map((job) => (
    <Entry key={job.id} kicker={job.period} title={job.role} subtitle={`${job.company} · ${job.location}`}>
      <p>{job.summary}</p>
      <Bullets items={job.highlights} />
    </Entry>
  ));
}
