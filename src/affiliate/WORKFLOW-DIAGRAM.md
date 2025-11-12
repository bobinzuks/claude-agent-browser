# SignupAssistant Workflow Diagram

## High-Level Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                    HUMAN-IN-LOOP SIGNUP FLOW                     │
│                  (Compliance-First Architecture)                 │
└─────────────────────────────────────────────────────────────────┘

┌─────────────┐
│    START    │
│   Session   │
└──────┬──────┘
       │
       ▼
┌─────────────────────────────┐
│  Detect Signup Form         │
│  • Find form element        │
│  • Identify fields          │
│  • Locate submit button     │
│  • Extract labels           │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────┐
│  Show Field Checklist       │
│  • Required fields          │
│  • Sensitive fields         │
│  • Optional fields          │
└──────┬──────────────────────┘
       │
       ▼
┌─────────────────────────────────────────┐
│  REQUEST PERMISSION (COMPLIANCE)        │
│  ┌─────────────────────────────────┐   │
│  │  Permission Dialog              │   │
│  │  • Action: Pre-fill Form        │   │
│  │  • Description                  │   │
│  │  • Risks                        │   │
│  │  • [DENY]  [APPROVE]           │   │
│  └─────────────────────────────────┘   │
└──────┬────────────────────┬─────────────┘
       │ DENIED             │ APPROVED
       │                    │
       ▼                    ▼
   ┌──────┐         ┌─────────────────────────────┐
   │ SKIP │         │  Pre-fill Form              │
   │      │         │  • Match data to fields     │
   └──┬───┘         │  • Fill non-sensitive only  │
      │             │  • Skip passwords/payment   │
      │             │  • Highlight filled fields  │
      │             └──────┬──────────────────────┘
      │                    │
      └────────┬───────────┘
               │
               ▼
       ┌─────────────────────────────┐
       │  Show Visual Guidance       │
       │  • "Review all fields"      │
       │  • "Enter password manually"│
       │  • "Click Submit when ready"│
       └──────┬──────────────────────┘
              │
              ▼
       ┌─────────────────────────────────────────────┐
       │  WAIT FOR HUMAN SUBMISSION                  │
       │  (COMPLIANCE CRITICAL - NEVER AUTOMATED)    │
       │                                             │
       │  ┌─────────────────────────────────────┐   │
       │  │  System Only Observes:              │   │
       │  │  • Listens for submit event         │   │
       │  │  • NEVER clicks submit button       │   │
       │  │  • Timeout after 5 minutes          │   │
       │  └─────────────────────────────────────┘   │
       └──────┬──────────────────────┬───────────────┘
              │                      │
         TIMEOUT                  HUMAN
              │                   SUBMITS
              ▼                      ▼
       ┌──────────┐         ┌─────────────────────────┐
       │  FAILED  │         │  Record Completion      │
       │          │         │  • Log submission       │
       └──────────┘         │  • Update AgentDB       │
                            │  • Save to vault        │
                            │  • Show success         │
                            └──────┬──────────────────┘
                                   │
                                   ▼
                            ┌─────────────────┐
                            │  End Session    │
                            │  • Cleanup UI   │
                            │  • Save logs    │
                            └─────────────────┘
                                   │
                                   ▼
                            ┌─────────────────┐
                            │   COMPLETE ✓    │
                            └─────────────────┘
```

## Detailed Component Flow

### 1. Form Detection

```
detectSignupForm(networkId)
       │
       ├─→ Find all <form> elements
       │
       ├─→ Identify signup form (heuristics)
       │   ├─→ Check form text for "sign up"
       │   ├─→ Check action URL
       │   └─→ Fallback to first form
       │
       ├─→ Detect form fields
       │   ├─→ Query input, select, textarea
       │   ├─→ Extract name, type, label
       │   ├─→ Identify required fields
       │   └─→ Mark sensitive fields
       │
       ├─→ Find submit button
       │   ├─→ button[type="submit"]
       │   ├─→ input[type="submit"]
       │   └─→ Heuristic button matching
       │
       └─→ Return SignupForm object
```

### 2. Permission System (COMPLIANCE)

```
requestPermission(action, description, risks)
       │
       ├─→ Create permission dialog
       │   ├─→ Show action name
       │   ├─→ Show description
       │   ├─→ List risks
       │   ├─→ Add backdrop
       │   └─→ Add buttons
       │
       ├─→ Wait for user response
       │   ├─→ Approve button clicked → true
       │   └─→ Deny button clicked → false
       │
       ├─→ Log decision
       │   └─→ Add to compliance logs
       │
       └─→ Return approval status
```

### 3. Smart Pre-filling

```
prefillForm(form, userData)
       │
       ├─→ Request permission ← COMPLIANCE CHECK
       │   └─→ If denied → STOP
       │
       ├─→ For each form field:
       │   │
       │   ├─→ Is sensitive?
       │   │   └─→ YES → SKIP (log & continue)
       │   │
       │   ├─→ Match userData to field
       │   │   ├─→ Direct name match
       │   │   ├─→ Label matching
       │   │   └─→ Pattern matching
       │   │
       │   ├─→ Fill field value
       │   │   ├─→ Set input.value
       │   │   ├─→ Trigger events
       │   │   └─→ Highlight field
       │   │
       │   └─→ Record completion
       │
       └─→ Show guidance
```

### 4. Human Submission (COMPLIANCE CRITICAL)

```
waitForHumanSubmit()
       │
       ├─→ Show instruction
       │   └─→ "Please review and submit"
       │
       ├─→ Add event listener to form
       │   └─→ Listen for 'submit' event
       │
       ├─→ Set 5-minute timeout
       │
       ├─→ Wait for event...
       │
       ├─→ Form submitted by human
       │   ├─→ Clear timeout
       │   ├─→ Remove listeners
       │   ├─→ Log submission
       │   ├─→ Mark session.humanSubmitted = true
       │   └─→ Return true
       │
       └─→ Timeout occurred
           └─→ Return false

IMPORTANT: This function NEVER calls:
  ❌ submitButton.click()
  ❌ form.submit()
  ❌ Any programmatic submission
```

## Data Flow Diagram

```
┌─────────────┐
│  UserData   │  (firstName, lastName, email, etc.)
└──────┬──────┘
       │
       ▼
┌─────────────────────────┐
│  SignupAssistant        │
│  ┌──────────────────┐   │
│  │  matchUserData   │   │  Match fields to data
│  │  ToField()       │   │  using intelligent
│  └────────┬─────────┘   │  pattern matching
│           │             │
│           ▼             │
│  ┌──────────────────┐   │
│  │  fillField()     │   │  Fill only if:
│  │                  │   │  • Permission granted
│  └────────┬─────────┘   │  • Not sensitive
│           │             │  • Field exists
│           ▼             │
│  ┌──────────────────┐   │
│  │  Highlight       │   │  Visual feedback
│  │  Field           │   │
│  └──────────────────┘   │
└─────────────────────────┘
       │
       ▼
┌─────────────────┐
│  Form Element   │  (DOM updated with values)
└─────────────────┘
       │
       ▼
   [HUMAN REVIEWS]
       │
       ▼
   [HUMAN CLICKS SUBMIT]
       │
       ▼
┌─────────────────────────┐
│  AgentDB / Compliance   │  (Logs and tracking)
└─────────────────────────┘
```

## Permission Flow Diagram

```
                    ┌──────────────┐
                    │   ACTION     │
                    │  REQUESTED   │
                    └──────┬───────┘
                           │
                           ▼
                  ┌────────────────────┐
                  │  Permission Dialog │
                  └────────┬───────────┘
                           │
           ┌───────────────┴───────────────┐
           │                               │
           ▼                               ▼
    ┌────────────┐                  ┌────────────┐
    │   DENY     │                  │  APPROVE   │
    └──────┬─────┘                  └──────┬─────┘
           │                               │
           ▼                               ▼
    ┌────────────┐                  ┌────────────┐
    │ Log Denial │                  │ Log Approval│
    └──────┬─────┘                  └──────┬─────┘
           │                               │
           ▼                               ▼
    ┌────────────┐                  ┌────────────┐
    │ Skip Action│                  │ Execute    │
    └────────────┘                  │ Action     │
                                    └────────────┘
```

## Session Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                      SESSION LIFECYCLE                       │
└─────────────────────────────────────────────────────────────┘

startSession(networkId)
    ↓
    Creates SignupSession:
    ┌────────────────────────────────────┐
    │ networkId: string                  │
    │ startedAt: timestamp               │
    │ steps: []                          │
    │ fieldsCompleted: Set<string>       │
    │ humanSubmitted: false              │
    │ permissions: []                    │
    └────────────────────────────────────┘
    ↓
    [Signup workflow executes...]
    ↓
    Session updates:
    • steps.push(new guidance steps)
    • permissions.push(approval/denial)
    • fieldsCompleted.add(field names)
    ↓
    [Human submits form]
    ↓
    humanSubmitted = true
    completedAt = timestamp
    ↓
recordSignupComplete(networkId)
    ↓
    • Save to AgentDB
    • Update network status
    • Export compliance logs
    ↓
endSession()
    ↓
    • Set session = null
    • Call cleanup()
    • Remove UI elements
```

## Compliance Checkpoint Flow

```
                    ┌────────────┐
                    │   ACTION   │
                    └─────┬──────┘
                          │
                          ▼
              ┌─────────────────────┐
              │  COMPLIANCE CHECK   │
              └─────────┬───────────┘
                        │
        ┌───────────────┼───────────────┐
        │               │               │
        ▼               ▼               ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Permission  │ │  Sensitive   │ │  Logging     │
│   Required?  │ │    Field?    │ │   Active?    │
└──────┬───────┘ └──────┬───────┘ └──────┬───────┘
       │                │                │
       ▼                ▼                ▼
    ✓ YES            ✓ SKIP          ✓ LOG
       │                │                │
       └────────────────┴────────────────┘
                        │
                        ▼
                ┌──────────────┐
                │  Proceed or  │
                │     Skip     │
                └──────────────┘
```

## Error Handling Flow

```
┌────────────────┐
│  Try Action    │
└────────┬───────┘
         │
         ├─→ Success → Continue
         │
         └─→ Error
             │
             ├─→ Log error
             │
             ├─→ Show user message
             │
             ├─→ Cleanup partial state
             │
             ├─→ Record in compliance log
             │
             └─→ Decide:
                 ├─→ Retry → Loop back
                 ├─→ Skip → Continue
                 └─→ Abort → End session
```

## Visual Guide Panel Structure

```
┌──────────────────────────────────────┐
│  Signup Assistant                    │
│ ════════════════════════════════════ │
│                                      │
│  ✓ Detected form (7 fields)         │
│  ✓ Pre-filled 4 fields               │
│  ✓ Skipped 1 sensitive field         │
│                                      │
│  Required Fields:                    │
│  ☐ First Name                        │
│  ☐ Last Name                         │
│  ☐ Email                             │
│  ☐ Password (manual)                 │
│                                      │
│  → Please review all fields          │
│  → Enter password manually           │
│  → Click Submit when ready           │
│                                      │
└──────────────────────────────────────┘
```

## State Machine

```
     ┌─────────┐
     │  IDLE   │
     └────┬────┘
          │ startSession()
          ▼
     ┌──────────┐
     │ DETECTING│
     └────┬─────┘
          │ detectSignupForm()
          ▼
     ┌──────────┐
     │REQUESTING│────┐
     │PERMISSION│    │ denied
     └────┬─────┘    │
          │ approved │
          ▼          │
     ┌──────────┐    │
     │ FILLING  │←───┘
     └────┬─────┘
          │ prefillForm()
          ▼
     ┌──────────┐
     │ WAITING  │───┐
     │  HUMAN   │   │ timeout
     └────┬─────┘   │
          │ submitted│
          ▼         │
     ┌──────────┐   │
     │RECORDING │   │
     └────┬─────┘   │
          │         │
          ▼         ▼
     ┌──────────┐┌──────────┐
     │ COMPLETE ││  FAILED  │
     └────┬─────┘└────┬─────┘
          │           │
          └─────┬─────┘
                │ endSession()
                ▼
          ┌─────────┐
          │  IDLE   │
          └─────────┘
```

## Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Browser Environment                   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │             SignupAssistant                       │  │
│  │  ┌─────────────────────────────────────────────┐ │  │
│  │  │          Core Logic                         │ │  │
│  │  │  • Form detection                           │ │  │
│  │  │  • Permission system                        │ │  │
│  │  │  • Pre-filling engine                       │ │  │
│  │  │  • Visual guidance                          │ │  │
│  │  └────────────┬────────────────────────────────┘ │  │
│  │               │                                   │  │
│  │  ┌────────────┼────────────────────────────────┐ │  │
│  │  │            │    Integration Layer           │ │  │
│  │  │  ┌─────────▼─────────┐  ┌────────────────┐ │ │  │
│  │  │  │     AgentDB       │  │ PasswordVault  │ │ │  │
│  │  │  │  • Pattern store  │  │ • Credentials  │ │ │  │
│  │  │  │  • Compliance log │  │ • Encryption   │ │ │  │
│  │  │  └───────────────────┘  └────────────────┘ │ │  │
│  │  └────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────┘  │
│                          │                              │
│                          ▼                              │
│  ┌──────────────────────────────────────────────────┐  │
│  │                    DOM                            │  │
│  │  • Form elements                                  │  │
│  │  • Input fields                                   │  │
│  │  • Visual overlays                                │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Summary

This workflow ensures:

✓ **Human Approval** - All actions require explicit permission
✓ **Human Submission** - Form submission is NEVER automated
✓ **Sensitive Protection** - Passwords/payment info never auto-filled
✓ **Complete Audit** - All actions logged with timestamps
✓ **Visual Guidance** - Clear instructions throughout process
✓ **Error Recovery** - Graceful handling of failures
✓ **Clean Separation** - Assistance vs. automation clearly distinguished

**KEY PRINCIPLE:** The system assists and guides, but the human remains in complete control.
