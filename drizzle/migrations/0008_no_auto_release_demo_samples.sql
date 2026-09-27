DO $migration$
DECLARE
  definition text;
  sample_start integer;
  next_row integer;
BEGIN
  definition := pg_get_functiondef('public.reset_demo_data()'::regprocedure);
  IF position('''America/Denver'',''released'',null,''2026-09-23T10:00Z''' in definition) = 0 THEN
    RAISE EXCEPTION 'Expected original reset sample not found';
  END IF;
  definition := replace(definition, '''America/Denver'',''released'',null,''2026-09-23T10:00Z''', '''America/Denver'',''no_show'',null,null');
  sample_start := position(E'\n (''release_notice'',''sent''' in definition);
  IF sample_start = 0 THEN RAISE EXCEPTION 'Expected reset sample email not found'; END IF;
  next_row := position(E'\n (''reminder_1h''' in substr(definition, sample_start));
  IF next_row = 0 THEN RAISE EXCEPTION 'Expected next sample email not found'; END IF;
  definition := left(definition, sample_start - 1) || substr(definition, sample_start + next_row - 1);
  EXECUTE definition;

  definition := pg_get_functiondef('public.generate_demo_data()'::regprocedure);
  IF position('''released'',false,''Moving an on-prem Teradata' in definition) = 0 THEN
    RAISE EXCEPTION 'Expected generated sample not found';
  END IF;
  definition := replace(definition, '''released'',false,''Moving an on-prem Teradata', '''no_show'',false,''Moving an on-prem Teradata');
  IF position('elsif r.status = ''released'' then' in definition) = 0 THEN
    RAISE EXCEPTION 'Expected generated release email branch not found';
  END IF;
  sample_start := position('    elsif r.status = ''released'' then' in definition);
  next_row := position(E'\n    end if;' in substr(definition, sample_start));
  IF sample_start = 0 OR next_row = 0 THEN RAISE EXCEPTION 'Expected generated release branch boundaries not found'; END IF;
  definition := left(definition, sample_start - 1) || substr(definition, sample_start + next_row - 1);
  EXECUTE definition;
END
$migration$;