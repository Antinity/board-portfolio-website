import { caseInfo } from "@/data/content";
import { CENTER_CARD } from "@/data/boardLayout";
import { Paper, Stamp } from "@/components/evidence";
import styles from "./board.module.css";

/** The case title card in the middle of the board. */
export default function CaseCard() {
  const { x, y, w, h } = CENTER_CARD.bounds;
  return (
    <div className={styles.caseCard} style={{ left: x, top: y, width: w, height: h }}>
      <Paper style={{ height: "100%", padding: "40px 34px" }}>
        <div className={styles.caseNo}>Case file № {caseInfo.caseNumber}</div>
        <h2 className={styles.caseName}>{caseInfo.name}</h2>
        <div className={styles.caseTitle}>{caseInfo.title}</div>
        <div className={styles.caseStamp}>
          <Stamp rotate={-12}>{caseInfo.status}</Stamp>
        </div>
      </Paper>
    </div>
  );
}
