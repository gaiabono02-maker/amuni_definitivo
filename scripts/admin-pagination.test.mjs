import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fetchAllRows } from '../src/lib/admin-pagination.ts';

test('loads registrations beyond the API row limit, without duplicates', async () => {
  const registrations = Array.from({length:1203}, (_, id) => ({id}));
  const ranges=[];
  const result=await fetchAllRows(async (from,to) => {
    ranges.push([from,to]);
    return {data:registrations.slice(from,to+1),error:null};
  });
  assert.deepEqual(result.data,registrations);
  assert.equal(ranges.length,3);
});

test('does not present an incomplete list when a later page fails', async () => {
  await assert.rejects(fetchAllRows(async from => from === 0
    ? {data:Array.from({length:500}, (_,id)=>({id})),error:null}
    : {data:null,error:{message:'Connection failed'}}), /Connection failed/);
});
