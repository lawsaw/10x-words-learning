-- migration: 20251125000001_add_word_transcription.sql
-- purpose: add transcription column to words table to store phonetic pronunciation in user's native alphabet

begin;

-- add transcription column to words table
alter table app.words
add column transcription text;

comment on column app.words.transcription is 'phonetic transcription of the term using the user''s native language alphabet to aid pronunciation';

commit;



