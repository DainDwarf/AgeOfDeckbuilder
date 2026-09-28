import { expect, test } from 'vitest';
import { newCampaign } from './campaign';
import { catalogued } from './catalogue';
import { CATALOGUE, CIVILIZATION, CIVILIZATION_ID, chronicleSaved } from './fixtures';
import { writeSave } from './save';
import { readSaveFile, writeSaveFile } from './save-file';

test('a save written as a save file reads back whole, the chronicle in progress beside the campaign', () => {
  const campaign = newCampaign(CATALOGUE, CIVILIZATION_ID);
  const progress = chronicleSaved();

  expect(readSaveFile(CATALOGUE, writeSaveFile(CATALOGUE, campaign, progress))).toEqual({
    save: { campaign, chronicle: progress },
    dropped: [],
  });
});

test('a civilization named in letters outside Latin-1 reads back whole from a save file', () => {
  const name = 'Nómadas 遊牧民';
  const catalogue = catalogued({
    ...CATALOGUE,
    civilizations: { [name]: CIVILIZATION, ...CATALOGUE.civilizations },
  });
  const campaign = newCampaign(catalogue, name);

  expect(readSaveFile(catalogue, writeSaveFile(catalogue, campaign))).toEqual({
    save: { campaign, chronicle: undefined },
    dropped: [],
  });
});

test('a save file whose chronicle was written on another content version reads as its campaign, the chronicle dropped with its reason', () => {
  const campaign = newCampaign(CATALOGUE, CIVILIZATION_ID);
  const text = writeSaveFile(CATALOGUE, campaign, chronicleSaved());
  const next = catalogued({ ...CATALOGUE, version: 'fixture-next' });

  expect(readSaveFile(next, text)).toEqual({
    save: { campaign, chronicle: undefined },
    dropped: ['fixture-next: a chronicle begun on fixture is played on no other content'],
  });
});

test('a save file that is not base64, not UTF-8 text, not a save, or holds no campaign is refused whole, with its reason', () => {
  const text = writeSave(CATALOGUE, newCampaign(CATALOGUE, CIVILIZATION_ID), chronicleSaved());
  const campaignless = JSON.stringify({ ...JSON.parse(text), campaign: 1 });

  expect(readSaveFile(CATALOGUE, text)).toEqual({
    dropped: ['fixture: the save file is not base64'],
  });
  expect(readSaveFile(CATALOGUE, btoa('\xff\xfe'))).toEqual({
    dropped: ['fixture: the save file is not UTF-8 text'],
  });
  expect(readSaveFile(CATALOGUE, btoa('not a save'))).toEqual({
    dropped: ['fixture: the save is not JSON'],
  });
  expect(readSaveFile(CATALOGUE, btoa(campaignless))).toEqual({
    dropped: ["fixture: the save's campaign is not an object"],
  });
});
