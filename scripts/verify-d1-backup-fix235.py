import pathlib, sqlite3, sys, tempfile
p=pathlib.Path(sys.argv[1]).resolve()
sql=p.read_text(encoding='utf-8-sig')
if len(sql)<128 or not any(x in sql.upper() for x in ('CREATE TABLE','INSERT INTO','PRAGMA')):
    raise SystemExit('Plik nie wygląda na eksport SQL D1.')
with tempfile.TemporaryDirectory(prefix='nauka-d1-verify-') as td:
    db=sqlite3.connect(str(pathlib.Path(td)/'restore-test.sqlite'))
    db.execute('PRAGMA foreign_keys=ON')
    try:
        db.executescript(sql)
        db.execute('PRAGMA integrity_check')
        check=db.execute('PRAGMA integrity_check').fetchone()[0]
        if check!='ok': raise RuntimeError(f'SQLite integrity_check: {check}')
        tables=db.execute("SELECT COUNT(*) FROM sqlite_master WHERE type='table'").fetchone()[0]
        if tables<1: raise RuntimeError('Eksport nie zawiera tabel.')
        print(f'[PASS] Lokalny test odtworzenia: {tables} tabel; integrity_check=ok; kopia źródłowa bez zmian.')
    finally: db.close()
