/**
 * Maps selected main program to the `program` query param for /required-documents.
 * Prefer API slug/code on the main program; fall back to conventional IDs when missing.
 * (App menu treats main_program.id === 2 as memorization / tahfiz.)
 */
export function mapMainProgramSelectionToProgramParam(mainProgramId, mainProgram) {
    const raw = (mainProgram?.slug ?? mainProgram?.code ?? '').toString().toLowerCase().trim();
    if (raw === 'tahfiz' || raw === 'taaleem')
        return raw;
    const id = Number(mainProgramId);
    if (!Number.isFinite(id))
        return null;
    if (id === 2)
        return 'tahfiz';
    if (id === 1)
        return 'taaleem';
    return null;
}
