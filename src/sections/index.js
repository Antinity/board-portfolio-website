import { SECTION_LAYOUT } from "@/data/boardLayout";
import { ProfileEvidence, ProfileFile } from "./profile";
import { ExperienceEvidence, ExperienceFile } from "./experience";
import { SkillsEvidence, SkillsFile } from "./skills";
import { ProjectsEvidence, ProjectsFile } from "./projects";
import { ContactEvidence, ContactFile } from "./contact";
import { SocialsEvidence, SocialsFile } from "./socials";
import { EducationEvidence, EducationFile } from "./education";

/**
 * Section registry: pairs each layout entry with
 *  - Evidence: how it looks pinned on the board
 *  - File:     the expanded content shown in the case-file panel
 *
 * To add a section: add geometry in data/boardLayout.js, create a module here
 * exporting both components, and register it below.
 */
const COMPONENTS = {
  profile: { Evidence: ProfileEvidence, File: ProfileFile },
  experience: { Evidence: ExperienceEvidence, File: ExperienceFile },
  skills: { Evidence: SkillsEvidence, File: SkillsFile },
  projects: { Evidence: ProjectsEvidence, File: ProjectsFile },
  contact: { Evidence: ContactEvidence, File: ContactFile },
  socials: { Evidence: SocialsEvidence, File: SocialsFile },
  education: { Evidence: EducationEvidence, File: EducationFile },
};

export const SECTIONS = SECTION_LAYOUT.filter((s) => COMPONENTS[s.id]).map((s) => ({ ...s, ...COMPONENTS[s.id] }));
