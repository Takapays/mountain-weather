-- Optional read-only queries for Supabase SQL Editor.

-- 1) Daily activity
select * from public.usage_daily_summary limit 30;

-- 2) Most selected mountains
select mountain, count(*) as analyses
from public.usage_events
where event_name = 'weather_analysis' and success is true and mountain is not null
  and created_at >= now() - interval '30 days'
group by mountain
order by analyses desc
limit 20;

-- 3) Slowest successful trail calculations
select created_at, mountain, duration_ms, route_points,
       metadata->>'distance_km' as distance_km,
       metadata->>'fallback_segments' as fallback_segments
from public.usage_events
where event_name = 'trail_route_calculated' and success is true
order by duration_ms desc nulls last
limit 50;

-- 4) Recent failures
select created_at, event_name, mountain, error_message, duration_ms
from public.usage_events
where success is false
order by created_at desc
limit 100;
