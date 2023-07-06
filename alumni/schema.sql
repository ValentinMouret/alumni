create table if not exists tickets (
  id integer primary key autoincrement,
  first_name text not null,
  last_name text not null,

  unique (first_name, last_name)
);

create table if not exists check_ins (
  ticket_id  integer primary key references tickets,
  created_at text not null
);
