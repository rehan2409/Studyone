# StudyOne — Student Productivity Platform

## Run
```bash
npm install
npm run dev
```
Opens at http://localhost:5173

## Supabase SQL — Run this FIRST in Supabase SQL Editor

```sql
create extension if not exists "uuid-ossp";

create table profiles (
  id uuid references auth.users primary key,
  name text, email text, college text,
  branch text, year text, cgpa text,
  created_at timestamptz default now()
);

create table notes (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text not null, content text, subject text,
  tags text[], color_idx int default 0, favorite boolean default false,
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create table assignments (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  title text not null, subject text, description text,
  due_date timestamptz, priority text default 'medium', status text default 'pending',
  created_at timestamptz default now()
);

create table expenses (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  type text not null, amount numeric not null,
  category text, description text, date timestamptz default now()
);

create table timetable (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  subject text not null, faculty text, room text,
  day text, time text, duration int default 60, color text default '#3b82f6'
);

create table attendance (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  subject text not null, present int default 0, total int default 0
);

create table flashcards (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  subject text, question text not null, answer text not null,
  difficulty text default 'medium', created_at timestamptz default now()
);

create table timer_sessions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references profiles(id) on delete cascade,
  mode text default 'focus', duration int not null,
  created_at timestamptz default now()
);

create table rooms (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null, name text not null, subject text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

create table room_members (
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references profiles(id),
  joined_at timestamptz default now(),
  primary key (room_id, user_id)
);

create table room_messages (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references profiles(id),
  sender_name text, text text, type text default 'text',
  file_url text, file_name text,
  created_at timestamptz default now()
);

create table room_files (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references rooms(id) on delete cascade,
  user_id uuid references profiles(id),
  name text not null, type text, size bigint,
  url text not null, path text,
  uploaded_by text, created_at timestamptz default now()
);

create table whiteboard_strokes (
  id uuid default uuid_generate_v4() primary key,
  room_id uuid references rooms(id) on delete cascade,
  stroke_data jsonb not null, created_by text,
  created_at timestamptz default now()
);

-- Enable RLS
alter table profiles enable row level security;
alter table notes enable row level security;
alter table assignments enable row level security;
alter table expenses enable row level security;
alter table timetable enable row level security;
alter table attendance enable row level security;
alter table flashcards enable row level security;
alter table timer_sessions enable row level security;
alter table rooms enable row level security;
alter table room_members enable row level security;
alter table room_messages enable row level security;
alter table room_files enable row level security;
alter table whiteboard_strokes enable row level security;

-- Policies
create policy "own" on profiles for all using (auth.uid()=id);
create policy "own" on notes for all using (auth.uid()=user_id);
create policy "own" on assignments for all using (auth.uid()=user_id);
create policy "own" on expenses for all using (auth.uid()=user_id);
create policy "own" on timetable for all using (auth.uid()=user_id);
create policy "own" on attendance for all using (auth.uid()=user_id);
create policy "own" on flashcards for all using (auth.uid()=user_id);
create policy "own" on timer_sessions for all using (auth.uid()=user_id);
create policy "read" on rooms for select using (true);
create policy "insert" on rooms for insert with check (auth.uid()=created_by);
create policy "all" on room_members for all using (true);
create policy "all" on room_messages for all using (true);
create policy "all" on room_files for all using (true);
create policy "all" on whiteboard_strokes for all using (true);

-- Realtime
alter publication supabase_realtime add table room_messages;
alter publication supabase_realtime add table room_files;
alter publication supabase_realtime add table whiteboard_strokes;
alter publication supabase_realtime add table room_members;
```

## Storage Bucket
1. Supabase → Storage → New bucket → name: `studyone-files` → Public: ON

## GitHub Upload Steps
1. Go to github.com → New Repository → name: `studyone` → Create
2. Open terminal in project folder:
```bash
git init
git add .
git commit -m "Initial commit - StudyOne"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/studyone.git
git push -u origin main
```
Replace YOUR_USERNAME with your GitHub username.
