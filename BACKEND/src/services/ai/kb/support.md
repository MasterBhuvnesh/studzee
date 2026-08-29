# STUDZEE SUPPORT KNOWLEDGE BASE

Source text for the in app support assistant. Every `##` section below becomes
one retrievable passage, so each section must stand on its own: a reader who
sees only that section should still get a complete answer.

Levels, badges and topics are not written here. They are rendered into passages
straight from `src/models/gamification.ts` and `src/models/topics.ts` at index
time, so the ladder and the badge list cannot drift out of date in this file.

Rewrite a section and run `npm run ai:reindex` for the change to take effect.
Nothing here reaches the assistant until that runs.

## WHAT STUDZEE IS

Studzee is a study app for software engineering and machine learning topics.
Each piece of material carries the main text, a short summary, key notes for
revision, and a quiz. Some material has PDFs attached. Working through material
and answering quizzes earns points, which move you up a level ladder and unlock
badges.

The app has four tabs at the bottom: Home, Resources, Profile and Settings.
Everything else opens on top of a tab.

## FINDING STUDY MATERIAL

Open the Home tab to browse available material. Tapping any item opens the full
text, its key notes and its quiz.

Material is grouped by topic, and you can filter the list by topic or by tag.
The Home tab also surfaces a daily pick, so there is something to open without
searching for it.

Some material is locked until you have enough points. A locked item shows the
points it needs. There is no way to unlock it other than earning the points.

## POINTS AND GEMS

Points are the main progress currency. You earn them by submitting quiz answers
and by completing quests. Your points total decides your level.

Gems are the reward attached to a specific quest. Completing a quest pays its
gems once. The gems from a quest also count towards your points total, so quest
completions move you up the ladder exactly like quiz attempts do.

Neither points nor gems can be bought, transferred or reset by support.

## STREAKS

A streak counts consecutive days on which you recorded activity. Any activity
counts: submitting a quiz or completing a quest.

Days are counted in UTC, not your local time. That is why activity late at night
can land on what looks like the next day to you.

The app tracks both your current streak and the longest streak you have ever
reached. Missing a day resets the current streak to zero. The longest streak is
never reduced.

Streaks are worked out from your recorded activity history rather than stored as
a number the app trusts, so a missed day cannot be restored by support.

## QUIZZES

Every piece of study material carries a quiz. Each question has several options
and exactly one correct answer.

Submitting a quiz records an attempt with your score, and awards points based on
how you did. A perfect score is tracked separately because several badges depend
on perfect attempts rather than attempts in general.

You can retake a quiz. Recent quizzes are listed on their own screen, reachable
from the Profile tab.

## QUESTS

A quest is a limited time challenge worth a fixed number of gems. Quests appear
on the Quests screen while they are open, with the time remaining.

There are four kinds:

- Multiple choice, where more than one option can be right
- Single choice, where exactly one option is right
- Fill in the blank, where you type the missing word or phrase
- Read, which asks you to open a specific piece of study material

Graded quests have a pass mark. Scoring below it pays nothing, and the app says
so rather than showing an error. You can try again while the quest is still
open.

Each quest pays out once per person. Completing a quest you have already
completed pays nothing and is not an error.

A quest that has closed, or that has been withdrawn, no longer accepts
completions.

## DOWNLOADS AND OFFLINE ACCESS

PDFs attached to study material can be downloaded to your device. Open the
Resources tab, or the PDFs screen, and download a PDF from there. Downloaded
PDFs appear under the Downloaded tab and open without a connection.

Tapping a downloaded PDF opens a sheet with three options: view it, share it, or
remove it from the device. Removing it frees the space and leaves the PDF
available to download again.

The study text and quizzes themselves are not yet available offline. Only PDFs
are.

## NOTIFICATIONS

The app can send push notifications about new study material and newly opened
quests.

To turn them on, open the Settings tab and enable App Notifications. If the
switch does not stick, the permission was refused at the operating system level:
open your device settings for Studzee and allow notifications there.

There is currently no way to choose which kinds of notification you receive, and
no quiet hours setting. Turning notifications off at the operating system level
turns off all of them.

The Notifications screen inside the app shows a separate list of milestones such
as badge unlocks and perfect scores. That list is held on your device only.

## ACCOUNT AND PROFILE

Sign in and account details are handled through the app's sign in screen. Your
email address identifies your account.

To change your display name or profile picture, open the Profile tab and use the
edit option. Your bio is edited from the same screen.

Support cannot change your email address, merge two accounts, or recover an
account you no longer have access to through the app itself. Email
studzee247@gmail.com for anything of that kind.

## PRIVACY AND DATA

The Privacy Policy and the Terms of Use are both reachable from the Settings
tab.

The assistant answering these questions has no access to your account. It cannot
see your points, your streak, your quiz history, your downloads or your email.
Any question about your own data has to be answered by opening the relevant
screen in the app.

## CONTACTING A PERSON

Email studzee247@gmail.com for anything the app cannot resolve, including
account problems, billing questions, bug reports and content corrections.

Support is available Monday to Friday, 9 AM to 6 PM IST.

You can also send feedback from inside the app. Open Settings, then Send
Feedback, which lets you attach a rating and a category to your message.

## COMMON QUESTIONS

How do I access my study materials? Open the Home tab and browse the available
content. Tap any topic to see the full text, key notes and quiz.

How do I enable notifications? Open the Settings tab and turn on App
Notifications. If nothing happens, allow notifications for Studzee in your
device settings.

Can I use content offline? PDFs can be downloaded and read offline from the
Resources tab. Study text and quizzes still need a connection.

How do I update my profile? Open the Profile tab and use the edit option to
change your name, picture or bio.

Why did my streak reset? A streak resets when a day passes with no recorded
activity. Days are counted in UTC, so late night activity may fall on a
different day than you expect.

Why is this material locked? It needs more points than you currently have. The
item shows the number required.
