export function PublicFormNotice({ shareWithCompany = false }: { shareWithCompany?: boolean }) {
  return <>
    <div aria-hidden="true" style={{position: "absolute", left: "-10000px", width: "1px", height: "1px", overflow: "hidden"}}>
      <label>Lascia vuoto questo campo<input name="website" type="text" tabIndex={-1} autoComplete="off" /></label>
    </div>
    <p className="text-xs leading-relaxed text-muted-foreground">
      Usiamo i tuoi dati per gestire questa richiesta e ricontattarti.{shareWithCompany ? " Il contatto sarà condiviso con l’impresa a cui chiedi informazioni." : ""}{" "}
      <a href="/privacy" target="_blank" rel="noreferrer" className="underline">Leggi l’informativa privacy</a>.
    </p>
  </>;
}
