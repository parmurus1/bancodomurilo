# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

One person: Murilo, the owner. A personal finance app built for his own routine, not a product for other people. He uses it as much on his phone (logging an expense right after paying) as on the PC (sitting down to review the month).

## Product Purpose

Logging expenses and income, knowing at a glance how much is available and how the month is going, and setting money aside in "potes" (savings jars) with goals. Success means logging becomes a habit: fast enough not to be a chore, and pleasant enough that he wants to open the app.

## Positioning

A "bank" of his own, with his name on it (Banco do Murilo). Instead of a cold bank statement, the money lives in jars he names and fills himself, with challenges like days without spending. It is a personal tool, with no ads, no investment upsells, and no bank behind it.

## Operating Context

- Phone in hand, in the street or at the checkout: open, type the amount, choose the category, done. Seconds count.
- PC or phone at night: review the statement, charts, reports, how the potes are doing.
- Daily use is concentrated in: logging expenses, checking balance/summary, and potes/goals. Card and fixed bills are secondary.

## Capabilities and Constraints

- Static site (HTML, CSS, plain JS), no build step, published on Vercel from GitHub (github.com/parmurus1/bancodomurilo).
- Login and sync through Supabase; works offline (local-first data, PWA installable on the phone).
- Screens: Home, Statement (list + calendar), Potes, Plan (budgets, recurring items, 50/30/20), No-spend days (streak, goal, medals), Cards, Debts, Reports, Settings.
- Language: Brazilian Portuguese; values in BRL (R$), dates in dd/mm.
- Light and dark mode; "hide values" for using it in public.

## Brand Commitments

- Name: "Banco do Murilo". The logo is to be redone in the new style (Murilo's request, Oct 2026).
- Look requested by Murilo (Oct 2026): "BEEEM anos 2000", Windows XP and websites from that era, but modernized, easy on the eyes, and with a dark mode. He tried a modern "reference manual" style and didn't like it.
- Casual, direct tone in pt-BR ("Sobrou R$ X, que tal guardar?").

## Evidence on Hand

Only the user's own data and the built-in sample data. No testimonials, partners, or institutional claims; nothing like that should be invented.

## Product Principles

1. Logging an expense has to be faster than putting it off.
2. The most important number (how much I can spend) shows up first, with no hunting.
3. Every screen is easy to find: frequent tasks one tap away, rare ones out of the way.
4. Saving money should feel like a small win (potes filling up, streaks, medals), not homework.
5. Personality without sacrificing clarity: the app is his, it shouldn't look like a generic template.
