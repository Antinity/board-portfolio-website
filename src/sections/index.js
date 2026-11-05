import { SECTIONS as LAYOUT } from "@/data/boardLayout";
import { ApproachFile, ContactFile, JobsFile, RecordFile, SubjectFile, TodoFile, WitnessesFile } from "./files";

/**
 * Section registry: board geometry (data/boardLayout.js) + the expanded
 * case-file content shown when a section is opened.
 */
const FILES = {
  subject: SubjectFile,
  jobs: JobsFile,
  todo: TodoFile,
  approach: ApproachFile,
  witnesses: WitnessesFile,
  record: RecordFile,
  contact: ContactFile,
};

export const SECTIONS = LAYOUT.filter((s) => FILES[s.id]).map((s) => ({ ...s, File: FILES[s.id] }));
