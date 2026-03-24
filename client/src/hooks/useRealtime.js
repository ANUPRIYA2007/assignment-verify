import { useEffect, useRef } from 'react';
import supabase from '../lib/supabaseClient';

/**
 * Subscribe to Supabase Realtime Postgres Changes on a table.
 */
export function useRealtime(table, { onInsert, onUpdate, onDelete, filter, schema = 'public', enabled = true } = {}) {
    const channelRef = useRef(null);
    const callbacksRef = useRef({ onInsert, onUpdate, onDelete });

    // Keep callbacks fresh without re-subscribing
    useEffect(() => {
        callbacksRef.current = { onInsert, onUpdate, onDelete };
    });

    useEffect(() => {
        if (!enabled || !table) return;

        // Stable channel name — no Date.now()
        const channelName = `rt-${table}-${filter || 'all'}`;

        // Clean up any existing channel
        if (channelRef.current) {
            supabase.removeChannel(channelRef.current);
            channelRef.current = null;
        }

        const channelConfig = {
            event: '*',
            schema,
            table
        };

        if (filter) {
            channelConfig.filter = filter;
        }

        console.log(`[Realtime] Subscribing to ${table} (filter: ${filter || 'none'})`);

        const channel = supabase
            .channel(channelName)
            .on('postgres_changes', channelConfig, (payload) => {
                console.log(`[Realtime] ${table} ${payload.eventType}:`, payload);
                switch (payload.eventType) {
                    case 'INSERT':
                        callbacksRef.current.onInsert?.(payload.new);
                        break;
                    case 'UPDATE':
                        callbacksRef.current.onUpdate?.(payload.new, payload.old);
                        break;
                    case 'DELETE':
                        callbacksRef.current.onDelete?.(payload.old);
                        break;
                }
            })
            .subscribe((status) => {
                console.log(`[Realtime] ${table} status: ${status}`);
                if (status === 'SUBSCRIBED') {
                    console.log(`[Realtime] ✅ SUBSCRIBED to ${table}`);
                }
                if (status === 'CHANNEL_ERROR') {
                    console.error(`[Realtime] ❌ ERROR on ${table}`);
                }
            });

        channelRef.current = channel;

        return () => {
            console.log(`[Realtime] Unsubscribing from ${table}`);
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [table, filter, schema, enabled]);
}

/**
 * Helper: subscribe to multiple tables at once.
 */
export function useRealtimeMulti(subscriptions = []) {
    const channelsRef = useRef([]);

    useEffect(() => {
        channelsRef.current.forEach(ch => supabase.removeChannel(ch));
        channelsRef.current = [];

        subscriptions.forEach(({ table, onInsert, onUpdate, onDelete, filter, schema = 'public' }) => {
            const channelName = `rt-multi-${table}-${filter || 'all'}`;

            const channelConfig = {
                event: '*',
                schema,
                table
            };

            if (filter) {
                channelConfig.filter = filter;
            }

            const channel = supabase
                .channel(channelName)
                .on('postgres_changes', channelConfig, (payload) => {
                    console.log(`[Realtime-Multi] ${table} ${payload.eventType}:`, payload);
                    switch (payload.eventType) {
                        case 'INSERT':
                            onInsert?.(payload.new);
                            break;
                        case 'UPDATE':
                            onUpdate?.(payload.new, payload.old);
                            break;
                        case 'DELETE':
                            onDelete?.(payload.old);
                            break;
                    }
                })
                .subscribe((status) => {
                    console.log(`[Realtime-Multi] ${table} status: ${status}`);
                });

            channelsRef.current.push(channel);
        });

        return () => {
            channelsRef.current.forEach(ch => supabase.removeChannel(ch));
            channelsRef.current = [];
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [JSON.stringify(subscriptions.map(s => `${s.table}:${s.filter || ''}`))]);
}
