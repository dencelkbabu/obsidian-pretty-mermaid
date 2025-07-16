# Pretty Mermaid - Comprehensive Theme Testing

This document contains examples of all major Mermaid diagram types to test both Classic and Monochrome themes.

## Flowchart / Graph
```mermaid
graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action 1]
    B -->|No| D[Action 2]
    C --> E[End]
    D --> E
```

## Subgraph Example
```mermaid
graph TB
    subgraph "Frontend"
        A[React App]
        B[State Management]
        C[UI Components]
    end
    
    subgraph "Backend"
        D[API Gateway]
        E[Authentication]
        F[Business Logic]
    end
    
    A --> D
    B --> A
    C --> A
    D --> E
    E --> F
```

## Flowchart (Modern Syntax)
```mermaid
flowchart TD
    Start([Start Process]) --> Input[/"User Input"/]
    Input --> Process[Process Data]
    Process --> Decision{Valid Data?}
    Decision -->|Yes| Success[/Success Output/]
    Decision -->|No| Error[/Error Message/]
    Error --> Input
    Success --> End([End])
```

## Sequence Diagram
```mermaid
sequenceDiagram
    participant Alice
    participant Bob
    participant John

    Alice->>John: Hello John, how are you?
    loop Health check
        John->>John: Fight against hypochondria
    end
    Note right of John: Rational thoughts!
    John-->>Alice: Great!
    John->>Bob: How about you?
    Bob-->>John: Jolly good!
```

## Class Diagram
```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
    }
    class Dog {
        +String breed
        +bark()
    }
    class Cat {
        +boolean indoor
        +meow()
    }
    Animal <|-- Dog
    Animal <|-- Cat
```

## State Diagram
```mermaid
stateDiagram-v2
    [*] --> Still
    Still --> [*]
    Still --> Moving
    Moving --> Still
    Moving --> Crash
    Crash --> [*]
```

## Gantt Chart
```mermaid
gantt
    title Project Timeline
    dateFormat  YYYY-MM-DD
    section Phase 1
    Task 1          :a1, 2024-01-01, 30d
    Task 2          :after a1, 20d
    section Phase 2
    Task 3          :2024-02-01, 25d
    Task 4          :20d
```

## Pie Chart
```mermaid
pie title Pet Distribution
    "Dogs" : 386
    "Cats" : 85
    "Birds" : 15
```

## Entity Relationship Diagram
```mermaid
erDiagram
    CUSTOMER ||--o{ ORDER : places
    ORDER ||--|{ LINE-ITEM : contains
    CUSTOMER }|..|{ DELIVERY-ADDRESS : uses
    
    CUSTOMER {
        string name
        string email
        string phone
    }
    ORDER {
        int orderNumber
        date orderDate
        float total
    }
```

## User Journey
```mermaid
journey
    title My working day
    section Go to work
      Make tea: 5: Me
      Go upstairs: 3: Me
      Do work: 1: Me, Cat
    section Go home
      Go downstairs: 5: Me
      Sit down: 5: Me
```

## Git Graph
```mermaid
gitgraph
    commit
    commit
    branch develop
    checkout develop
    commit
    commit
    checkout main
    merge develop
    commit
```

## Requirements Diagram
```mermaid
requirementDiagram
    requirement test_req {
        id: 1
        text: the test text.
        risk: high
        verifymethod: test
    }
    element test_entity {
        type: simulation
    }
    test_entity - satisfies -> test_req
```