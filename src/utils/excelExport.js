import XlsxPopulate from 'xlsx-populate/browser/xlsx-populate';
import { teams, evaluationCriteria, juryProfiles } from '../data/juryData';

export const exportToExcel = (data, identifier) => {
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
  const juryId = parseInt(identifier, 10);
  const jury = data.jury || juryProfiles.find((j) => j.id === juryId);
  const filename = data.consolidated
    ? `SIH_Consolidated_Marksheet_${timestamp}.xlsx`
    : `SIH_Marksheet_${(jury?.name || `Jury_${identifier}`).replace(/\s+/g, '_')}_${timestamp}.xlsx`;

  const handleResult = (arrayBufferPromise) =>
    arrayBufferPromise
      .then((arrayBuffer) => {
        const blob = new Blob([arrayBuffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        triggerDownload(blob, filename);
      })
      .catch((error) => {
        console.error('Excel export failed:', error);
        window.alert('Unable to generate the spreadsheet. Please try again.');
      });

  if (data.consolidated) {
    handleResult(createConsolidatedWorkbook(data));
  } else {
    const workbookData = data.scores || data;
    handleResult(
      createIndividualWorkbook(workbookData, {
        jury,
        submittedAt: data.submittedAt
      })
    );
  }
};

const triggerDownload = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

const createConsolidatedWorkbook = async (data) => {
  const workbook = await XlsxPopulate.fromBlankAsync();

  const summarySheet = workbook.sheet(0).name('Summary');
  summarySheet.cell('A1').value('INTERNAL HACKATHON - CONSOLIDATED MARKSHEET');
  summarySheet.cell('A2').value('Parala Maharaja Engineering College');
  summarySheet.cell('A3').value(['Generated:', new Date(data.generatedAt).toLocaleString()]);
  summarySheet.cell('A5').value('TEAM RANKINGS (by Average Score)');
  summarySheet.cell('A6').value(['Rank', 'Team Name', 'Project Title', 'Average Score', 'Total Evaluators']);

  data.teams.forEach((team, index) => {
    summarySheet
      .row(7 + index)
      .cell(1)
      .value(index + 1)
      .cell(2)
      .value(team.name)
      .cell(3)
      .value(team.projectTitle)
      .cell(4)
      .value(parseFloat(team.averageScore))
      .cell(5)
      .value(team.submittedJuries);
  });

  summarySheet.column(1).width(8);
  summarySheet.column(2).width(20);
  summarySheet.column(3).width(35);
  summarySheet.column(4).width(15);
  summarySheet.column(5).width(18);

  const detailSheet = workbook.addSheet('Detailed Scores');
  const headerRow = [
    'Rank',
    'Team Name',
    'Project Title',
    'Members',
    ...evaluationCriteria.map((criteria) => `${criteria.name} (Avg)`),
    ...data.juries.flatMap((jury) => [
      ...evaluationCriteria.map((criteria) => `${jury.name} - ${criteria.name}`),
      `${jury.name} - Total`
    ]),
    'Overall Average',
    'Total Evaluators'
  ];

  detailSheet.cell('A1').value(headerRow);

  data.teams.forEach((team, index) => {
    const averages = evaluationCriteria.map((criteria) => parseFloat(team.scores[criteria.name]?.average || 0));
    const juryScores = data.juries.flatMap((jury) => {
      const juryScore = team.juryScores[jury.id];
      if (juryScore) {
        return [
          ...evaluationCriteria.map((criteria) => juryScore.scores[criteria.name] || 0),
          juryScore.total
        ];
      }
      return [...evaluationCriteria.map(() => 'N/A'), 'N/A'];
    });

    detailSheet
      .row(2 + index)
      .cell(1)
      .value(index + 1)
      .cell(2)
      .value(team.name)
      .cell(3)
      .value(team.projectTitle)
      .cell(4)
      .value((team.members || []).join(', ') || 'No members listed')
      .cell(5)
      .value(averages)
      .cell(5 + averages.length)
      .value(juryScores)
      .cell(headerRow.length)
      .value(parseFloat(team.averageScore))
      .cell(headerRow.length + 1)
      .value(team.submittedJuries);
  });

  detailSheet.column(1).width(8);
  detailSheet.column(2).width(20);
  detailSheet.column(3).width(30);
  detailSheet.column(4).width(40);
  headerRow.forEach((_, idx) => detailSheet.column(idx + 1).style({ bold: idx < headerRow.length }));

  return workbook.outputAsync();
};

const createIndividualWorkbook = async (scores, meta = {}) => {
  const workbook = await XlsxPopulate.fromBlankAsync();
  const sheet = workbook.sheet(0).name('Evaluation');

  sheet.cell('A1').value('Individual Evaluation Summary');
  sheet.cell('A2').value(['Evaluator', meta.jury?.name || '—']);
  sheet.cell('A3').value(['Jury ID', meta.jury?.id ?? '—']);
  sheet.cell('A4').value(['Last Submitted', meta.submittedAt ? new Date(meta.submittedAt).toLocaleString() : 'Not available']);
  sheet.cell('A5').value(['Exported', new Date().toLocaleString()]);
  sheet.cell('A7').value([
    'Team Name',
    ...evaluationCriteria.map((criteria) => `${criteria.name} (${criteria.maxMarks})`),
    `Total (${evaluationCriteria.reduce((sum, criteria) => sum + criteria.maxMarks, 0)})`
  ]);

  teams.forEach((team, index) => {
    const teamScores = scores[team.id] || {};
    const total = evaluationCriteria.reduce((sum, criteria) => sum + (teamScores[criteria.name] || 0), 0);
    sheet
      .row(8 + index)
      .cell(1)
      .value(team.name)
      .cell(2)
      .value(evaluationCriteria.map((criteria) => teamScores[criteria.name] || 0))
      .cell(2 + evaluationCriteria.length)
      .value(total);
  });

  sheet.column(1).width(20);
  evaluationCriteria.forEach((_, idx) => sheet.column(2 + idx).width(12));
  sheet.column(2 + evaluationCriteria.length).width(15);

  return workbook.outputAsync();
};
