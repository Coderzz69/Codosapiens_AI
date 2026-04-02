-- Contest
insert into contests (name, start_time, end_time, cooldown_seconds, penalty_seconds, early_bonus_percent)
values (
  'Mind Over Code',
  now(),
  now() + interval '4 hours',
  10,
  20,
  20
)
on conflict (name) do update set
  cooldown_seconds = excluded.cooldown_seconds,
  penalty_seconds = excluded.penalty_seconds,
  early_bonus_percent = excluded.early_bonus_percent
;

-- Question 1 (E)
with c as (select id from contests where name = 'Mind Over Code')
insert into questions (contest_id, order_index, title, description, input_format, output_format, difficulty, hint, time_limit_ms)
select c.id, 1,
  'Sum of Two Numbers',
  'Given two integers a and b, output their sum.',
  'Two integers a and b separated by space.',
  'Single integer: a + b.',
  'E',
  'Use 64-bit integers to avoid overflow.',
  1000
from c
on conflict (contest_id, order_index) do update set
  title = excluded.title,
  description = excluded.description,
  input_format = excluded.input_format,
  output_format = excluded.output_format,
  difficulty = excluded.difficulty,
  hint = excluded.hint,
  time_limit_ms = excluded.time_limit_ms
;

insert into test_cases (question_id, input_text, output_text, is_hidden, weight, group_id)
select q.id, t.input_text, t.output_text, t.is_hidden, t.weight, t.group_id
from (
  values
    ('2 3','5', false, 1, 1),
    ('-10 5','-5', false, 1, 1),
    ('1000000000 1000000000','2000000000', false, 1, 2),
    ('-999999999 999999999','0', true, 1, 3)
) as t(input_text, output_text, is_hidden, weight, group_id)
join questions q on q.order_index = 1 and q.contest_id = (select id from contests where name='Mind Over Code')
on conflict (question_id, input_text, output_text) do update set is_hidden = excluded.is_hidden;

-- Question 2 (E)
with c as (select id from contests where name = 'Mind Over Code')
insert into questions (contest_id, order_index, title, description, input_format, output_format, difficulty, hint, time_limit_ms)
select c.id, 2,
  'Even or Odd',
  'Given an integer n, print EVEN if it is even, otherwise ODD.',
  'Single integer n.',
  'EVEN or ODD in uppercase.',
  'E',
  'Check n % 2.',
  1000
from c
on conflict (contest_id, order_index) do update set
  title = excluded.title,
  description = excluded.description,
  input_format = excluded.input_format,
  output_format = excluded.output_format,
  difficulty = excluded.difficulty,
  hint = excluded.hint,
  time_limit_ms = excluded.time_limit_ms
;

insert into test_cases (question_id, input_text, output_text, is_hidden, weight, group_id)
select q.id, t.input_text, t.output_text, t.is_hidden, t.weight, t.group_id
from (
  values
    ('4','EVEN', false, 1, 1),
    ('7','ODD', false, 1, 1),
    ('0','EVEN', false, 1, 2),
    ('-3','ODD', true, 1, 3)
) as t(input_text, output_text, is_hidden, weight, group_id)
join questions q on q.order_index = 2 and q.contest_id = (select id from contests where name='Mind Over Code')
on conflict (question_id, input_text, output_text) do update set is_hidden = excluded.is_hidden;

-- Question 3 (M)
with c as (select id from contests where name = 'Mind Over Code')
insert into questions (contest_id, order_index, title, description, input_format, output_format, difficulty, hint, time_limit_ms)
select c.id, 3,
  'Range Sum Queries',
  'Given an array and Q queries (l, r), output the sum of elements in each range.',
  'First line: N Q. Second line: N integers. Next Q lines: l r (1-indexed).',
  'Q lines, each the sum for that range.',
  'M',
  'Precompute prefix sums to answer queries in O(1).',
  1500
from c
on conflict (contest_id, order_index) do update set
  title = excluded.title,
  description = excluded.description,
  input_format = excluded.input_format,
  output_format = excluded.output_format,
  difficulty = excluded.difficulty,
  hint = excluded.hint,
  time_limit_ms = excluded.time_limit_ms
;

insert into test_cases (question_id, input_text, output_text, is_hidden, weight, group_id)
select q.id, t.input_text, t.output_text, t.is_hidden, t.weight, t.group_id
from (
  values
    ('5 3\n1 2 3 4 5\n1 3\n2 5\n4 4\n','6\n14\n4', false, 1, 1),
    ('3 2\n10 20 30\n1 1\n1 3\n','10\n60', false, 1, 1),
    ('6 2\n-1 -2 -3 -4 -5 -6\n2 4\n1 6\n','-9\n-21', false, 1, 2),
    ('1 1\n999\n1 1\n','999', true, 1, 3)
) as t(input_text, output_text, is_hidden, weight, group_id)
join questions q on q.order_index = 3 and q.contest_id = (select id from contests where name='Mind Over Code')
on conflict (question_id, input_text, output_text) do update set is_hidden = excluded.is_hidden;

-- Question 4 (H)
with c as (select id from contests where name = 'Mind Over Code')
insert into questions (contest_id, order_index, title, description, input_format, output_format, difficulty, hint, time_limit_ms)
select c.id, 4,
  'Shortest Path in Grid',
  'Given a grid of 0 and 1, find the minimum steps from top-left to bottom-right moving 4-directionally. 0 is free, 1 is blocked.',
  'First line: R C. Next R lines: grid of 0/1 without spaces.',
  'Single integer: minimum steps, or -1 if impossible.',
  'H',
  'Use BFS on the grid.',
  2000
from c
on conflict (contest_id, order_index) do update set
  title = excluded.title,
  description = excluded.description,
  input_format = excluded.input_format,
  output_format = excluded.output_format,
  difficulty = excluded.difficulty,
  hint = excluded.hint,
  time_limit_ms = excluded.time_limit_ms
;

insert into test_cases (question_id, input_text, output_text, is_hidden, weight, group_id)
select q.id, t.input_text, t.output_text, t.is_hidden, t.weight, t.group_id
from (
  values
    ('3 3\n000\n010\n000\n','4', false, 1, 1),
    ('2 2\n01\n10\n','-1', false, 1, 1),
    ('4 4\n0000\n0110\n0000\n0010\n','6', false, 1, 2),
    ('1 1\n0\n','0', true, 1, 3)
) as t(input_text, output_text, is_hidden, weight, group_id)
join questions q on q.order_index = 4 and q.contest_id = (select id from contests where name='Mind Over Code')
on conflict (question_id, input_text, output_text) do update set is_hidden = excluded.is_hidden;

-- Question 5 (H)
with c as (select id from contests where name = 'Mind Over Code')
insert into questions (contest_id, order_index, title, description, input_format, output_format, difficulty, hint, time_limit_ms)
select c.id, 5,
  'Count Subarrays With Sum K',
  'Given an array and target K, count the number of subarrays with sum exactly K.',
  'First line: N K. Second line: N integers.',
  'Single integer: number of subarrays.',
  'H',
  'Use prefix sums with a hash map to count frequencies.',
  2000
from c
on conflict (contest_id, order_index) do update set
  title = excluded.title,
  description = excluded.description,
  input_format = excluded.input_format,
  output_format = excluded.output_format,
  difficulty = excluded.difficulty,
  hint = excluded.hint,
  time_limit_ms = excluded.time_limit_ms
;

insert into test_cases (question_id, input_text, output_text, is_hidden, weight, group_id)
select q.id, t.input_text, t.output_text, t.is_hidden, t.weight, t.group_id
from (
  values
    ('5 3\n1 2 1 1 1\n','3', false, 1, 1),
    ('3 0\n0 0 0\n','6', false, 1, 1),
    ('4 5\n5 -1 1 0\n','2', false, 1, 2),
    ('1 7\n7\n','1', true, 1, 3)
) as t(input_text, output_text, is_hidden, weight, group_id)
join questions q on q.order_index = 5 and q.contest_id = (select id from contests where name='Mind Over Code')
on conflict (question_id, input_text, output_text) do update set is_hidden = excluded.is_hidden;
