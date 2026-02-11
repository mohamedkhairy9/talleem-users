# Halaqa Plans Logic Explanation

## Overview

Halaqa plans are structured learning schedules that distribute Quranic content (verses) across the duration of a halaqa (study circle). The system automatically calculates and creates a daily schedule based on the halaqa's duration and the plan's configuration parameters.

## Plan Structure

### Core Plan Properties

```typescript
interface Plan {
    id: number;
    activity: 'hifz' | 'tasbit' | 'murajaa';  // Type of activity
    plan_type: 'daily_amount' | 'start_end';   // How the plan is structured
    unit: 'segments' | 'parts' | 'surahs';     // Unit of measurement
    direction: 'incremental' | 'decremental';   // Progress direction
    daily_amount: number;                       // Amount per day
    start_verse_id: number;                     // Starting verse ID
    end_verse_id: number;                       // Ending verse ID
    daily_schedule: DailyScheduleItem[];        // Generated daily breakdown
}
```

### Daily Schedule Item

```typescript
interface DailyScheduleItem {
    day: number;                // Day number (1, 2, 3, ...)
    date: string;               // Actual date for this day
    day_name: string;           // Day name (e.g., "Monday")
    from_verse_id: number;      // Starting verse ID for this day
    to_verse_id: number;        // Ending verse ID for this day
    from_text: string;          // Text of starting verse
    to_text: string;            // Text of ending verse
    text: string;               // Full text for the day's range
    juz_numbers?: number[];     // Juz numbers covered
}
```

## How Plans Are Created

### 1. **Plan Creation Parameters**

When creating a plan, you specify:
- **Activity**: What type of learning activity
  - `hifz`: Memorization
  - `tasbit`: Revision/consolidation
  - `murajaa`: Review/recitation practice

- **Plan Type**: How content is distributed
  - `daily_amount`: Fixed amount per day (e.g., 1 part per day)
  - `start_end`: Fixed start and end points

- **Unit**: What unit to measure in
  - `segments`: Specific segments
  - `parts`: Juz parts (1/30th of Quran)
  - `surahs`: Complete surahs

- **Direction**: How to progress
  - `incremental`: Start to end (verse 1 → 6236)
  - `decremental`: End to start (verse 6236 → 1)

- **Daily Amount**: How much to cover per day
  - Example: `1` part per day, `2` segments per day, etc.

- **Start Point**: Where to begin (depends on unit)
  - `start_juz_number`: When unit is 'parts'
  - `start_segment_id`: When unit is 'segments'
  - `start_surah_id`: When unit is 'surahs'

### 2. **Plan Generation Process**

The backend system:

1. **Calculates Total Content**: Based on the start point and halaqa duration
2. **Distributes Over Duration**: Uses `duration_in_days` from the halaqa to create daily breakdowns
3. **Generates Daily Schedule**: Creates a `daily_schedule` array with one entry per day

### 3. **Example: Daily Amount Plan**

Given:
- **Halaqa Duration**: 30 days
- **Activity**: `hifz` (memorization)
- **Unit**: `parts` (juz)
- **Daily Amount**: `1` part per day
- **Direction**: `incremental`
- **Start**: Juz 1

The system generates:
- **Total Coverage**: 30 parts (juz) over 30 days
- **Start Verse ID**: Verse 1 (beginning of Juz 1)
- **End Verse ID**: Verse 3563 (end of Juz 30, approximately)
- **Daily Schedule**: 30 items, each covering one juz

## Daily Schedule Breakdown

### Example Daily Schedule Item

```json
{
    "day": 1,
    "date": "2024-01-15",
    "day_name": "Monday",
    "from_verse_id": 1,
    "to_verse_id": 148,
    "from_text": "بِسْمِ اللَّهِ الرَّحْمٰنِ الرَّحِيمِ",
    "to_text": "تِلْكَ أُمَّةٌ قَدْ خَلَتْ...",
    "text": "Full text from verse 1 to 148...",
    "juz_numbers": [1]
}
```

### How Distribution Works

1. **Day 1**: Verses 1-148 (Juz 1)
2. **Day 2**: Verses 149-296 (Juz 2)
3. **Day 3**: Verses 297-444 (Juz 3)
4. ...continues incrementally...
5. **Day 18**: Verses 2674-2875 (Juz 18)
6. ...continues...
7. **Day 30**: Final verses (Juz 30)

The system calculates:
- **Verse Range per Day**: Based on `daily_amount` and `unit`
- **Progression**: Follows `direction` (incremental or decremental)
- **Date Assignment**: Maps each day to actual calendar dates based on halaqa `start_date`

## Plan Types Explained

### 1. **Daily Amount Plan** (`plan_type: 'daily_amount'`)

- **Purpose**: Fixed amount of content per day
- **Example**: 1 part per day, 2 segments per day
- **Calculation**: 
  ```
  Total Days = duration_in_days
  Content per Day = daily_amount × unit_size
  Total Content = Total Days × Content per Day
  ```

### 2. **Start-End Plan** (`plan_type: 'start_end'`)

- **Purpose**: Fixed start and end points
- **Calculation**: Content is evenly distributed across duration
- **Example**: From Juz 1 to Juz 10 over 20 days = 0.5 juz per day

## Units Explained

### 1. **Parts** (`unit: 'parts'`)
- Each part = 1 Juz (1/30th of Quran)
- Approximately 200 verses per part
- Example: `daily_amount: 1` = 1 juz per day

### 2. **Segments** (`unit: 'segments'`)
- Smaller divisions within juz
- More granular control
- Example: `daily_amount: 2` = 2 segments per day

### 3. **Surahs** (`unit: 'surahs'`)
- Complete surahs
- Variable length (short surahs vs. long surahs)
- Example: `daily_amount: 1` = 1 surah per day

## Direction Explained

### Incremental (`direction: 'incremental'`)
- Progresses from start to end
- Day 1: Beginning verses
- Day N: Ending verses
- **Use Case**: New memorization, sequential learning

### Decremental (`direction: 'decremental'`)
- Progresses from end to start
- Day 1: Ending verses
- Day N: Beginning verses
- **Use Case**: Revision, reverse order practice

## Activities Explained

### 1. **Hifz** (Memorization)
- Learning new content
- Typically incremental
- Focus on accuracy and retention

### 2. **Tasbit** (Consolidation)
- Strengthening memorized content
- Can be incremental or decremental
- Focus on reinforcement

### 3. **Murajaa** (Review)
- Reviewing previously memorized content
- Can cover multiple ranges
- Focus on maintenance

## Integration with Halaqa

### Halaqa Properties Used

```typescript
interface Halaqa {
    start_date: string;          // Used to calculate actual dates
    end_date: string;            // Used to validate duration
    duration_in_days: number;    // Used to generate daily_schedule
    weekly_holiday?: string;      // May affect day calculations
    // ... other properties
}
```

### Relationship

- **One Halaqa** can have **Multiple Plans**
- Each plan is for a **specific student** or **group of students**
- Plans are **independent** but share the same halaqa duration
- Daily schedules are **generated automatically** by the backend

## Backend Calculation Logic (Conceptual)

```javascript
// Pseudocode for plan generation
function generatePlan(halaqa, planConfig) {
    const duration = halaqa.duration_in_days;
    const dailyAmount = planConfig.daily_amount;
    const unit = planConfig.unit;
    const direction = planConfig.direction;
    
    // Calculate total content to cover
    const totalContent = calculateTotalContent(planConfig);
    
    // Calculate content per day
    const contentPerDay = dailyAmount * getUnitSize(unit);
    
    // Generate daily schedule
    const dailySchedule = [];
    let currentVerseId = planConfig.start_verse_id;
    
    for (let day = 1; day <= duration; day++) {
        const dayDate = calculateDate(halaqa.start_date, day, halaqa.weekly_holiday);
        const verseRange = calculateVerseRange(
            currentVerseId,
            contentPerDay,
            direction
        );
        
        dailySchedule.push({
            day: day,
            date: dayDate,
            day_name: getDayName(dayDate),
            from_verse_id: verseRange.from,
            to_verse_id: verseRange.to,
            from_text: getVerseText(verseRange.from),
            to_text: getVerseText(verseRange.to),
            text: getVerseRangeText(verseRange.from, verseRange.to),
            juz_numbers: getJuzNumbers(verseRange.from, verseRange.to)
        });
        
        // Update for next day
        currentVerseId = direction === 'incremental' 
            ? verseRange.to + 1 
            : verseRange.from - 1;
    }
    
    return {
        ...planConfig,
        start_verse_id: dailySchedule[0].from_verse_id,
        end_verse_id: dailySchedule[dailySchedule.length - 1].to_verse_id,
        daily_schedule: dailySchedule
    };
}
```

## Frontend Usage

### Displaying Plans

The frontend receives plans with pre-calculated `daily_schedule` arrays. Components can:

1. **Show Plan Overview**: Display plan type, unit, direction, daily amount
2. **Show Daily Schedule**: Display the full `daily_schedule` array
3. **Track Progress**: Compare current day with plan schedule
4. **Display Current Day**: Highlight today's verses based on `date` field

### Example: Accessing Daily Schedule

```typescript
// In a component
const plan: Plan = halaqa.plans[0];

// Get today's schedule
const today = new Date().toISOString().split('T')[0];
const todaySchedule = plan.daily_schedule.find(
    item => item.date === today
);

// Get all days
plan.daily_schedule.forEach(day => {
    console.log(`Day ${day.day}: Verses ${day.from_verse_id}-${day.to_verse_id}`);
});
```

## Key Points

1. **Automatic Generation**: Daily schedules are generated by the backend, not manually created
2. **Duration-Based**: Plans are always tied to halaqa `duration_in_days`
3. **Flexible Configuration**: Multiple plan types, units, and directions allow customization
4. **Complete Information**: Each daily schedule item includes verse IDs, text, dates, and juz numbers
5. **Student-Specific**: Each plan is created for a specific student or group
6. **Activity-Specific**: Different activities (hifz, tasbit, murajaa) can have different plans

## Summary

The halaqa plans system automatically distributes Quranic content across the halaqa's duration. When you create a plan with parameters like "1 part per day" for a 30-day halaqa, the system:

1. Calculates that 30 parts will be covered
2. Determines the verse ranges for each part
3. Creates 30 daily schedule items
4. Assigns actual dates based on the halaqa start date
5. Includes full verse text and metadata for each day

This allows students and teachers to see exactly what content should be covered each day of the halaqa.

