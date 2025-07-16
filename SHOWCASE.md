# Pretty Mermaid Plugin Showcase

This page demonstrates the beautiful Mermaid diagrams created by the Pretty Mermaid plugin for Obsidian.

## Classic Theme - Official Mermaid Styling

### Software Development Workflow

```mermaid
graph TD
    A[Start Project] --> B[Write Code]
    B --> C[Testing]
    C --> D{Tests Pass?}
    D -->|Yes| E[Deploy]
    D -->|No| F[Fix Bugs]
    F --> C
    E --> G[Monitor]
    G --> H{Issues Found?}
    H -->|Yes| F
    H -->|No| I[Success!]
```

### User Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant Auth
    participant Database
    
    User->>Frontend: Enter credentials
    Frontend->>Auth: Validate login
    Auth->>Database: Check user exists
    Database-->>Auth: User found
    Auth->>Auth: Generate JWT token
    Auth-->>Frontend: Return token + user data
    Frontend-->>User: Login successful
    
    Note over User,Database: Secure authentication complete
    
    User->>Frontend: Make authenticated request
    Frontend->>Auth: Verify token
    Auth-->>Frontend: Token valid
    Frontend->>Database: Execute request
    Database-->>Frontend: Return data
    Frontend-->>User: Display results
```

### Project Timeline

```mermaid
gantt
    title Pretty Mermaid Plugin Development
    dateFormat  YYYY-MM-DD
    section Planning
    Research & Design    :a1, 2024-01-01, 5d
    Architecture Planning :a2, after a1, 3d
    
    section Development
    Plugin Foundation    :b1, after a2, 7d
    Classic Theme       :b2, after b1, 4d
    Monochrome Theme    :b3, after b2, 3d
    
    section Testing
    Manual Testing      :c1, after b3, 3d
    Bug Fixes          :c2, after c1, 2d
    
    section Release
    Documentation      :d1, after c2, 2d
    Marketplace Submit :milestone, after d1, 0d
```

## Monochrome Theme - Clean Monochrome

### System Architecture

```mermaid
graph LR
    subgraph "Frontend"
        A[React App]
        B[State Management]
        C[UI Components]
    end
    
    subgraph "Backend"
        D[API Gateway]
        E[Authentication Service]
        F[Business Logic]
        G[Data Access Layer]
    end
    
    subgraph "Database"
        H[PostgreSQL]
        I[Redis Cache]
        J[File Storage]
    end
    
    A --> D
    B --> A
    C --> A
    D --> E
    D --> F
    F --> G
    G --> H
    G --> I
    G --> J
```

### Data Processing Pipeline

```mermaid
flowchart TD
    Start([Data Input]) --> Validate{Valid Format?}
    Validate -->|Yes| Clean[Clean & Normalize]
    Validate -->|No| Error[Log Error]
    
    Clean --> Transform[Transform Data]
    Transform --> Enrich[Enrich with Metadata]
    Enrich --> Store[(Store in Database)]
    
    Store --> Index[Update Search Index]
    Index --> Cache[Update Cache]
    Cache --> Notify[Notify Subscribers]
    Notify --> End([Complete])
    
    Error --> Retry{Retry?}
    Retry -->|Yes| Start
    Retry -->|No| End
```

### Class Hierarchy

```mermaid
classDiagram
    class Animal {
        +String name
        +int age
        +makeSound()
        +move()
    }
    
    class Mammal {
        +boolean furry
        +giveBirth()
    }
    
    class Bird {
        +boolean canFly
        +layEggs()
        +fly()
    }
    
    class Dog {
        +String breed
        +bark()
        +wagTail()
    }
    
    class Cat {
        +String color
        +meow()
        +purr()
    }
    
    class Eagle {
        +hunt()
        +soar()
    }
    
    Animal <|-- Mammal
    Animal <|-- Bird
    Mammal <|-- Dog
    Mammal <|-- Cat
    Bird <|-- Eagle
```

## Features Demonstrated

- **Beautiful Colors**: Official Mermaid color schemes with proper contrast
- **Clean Typography**: Trebuchet MS font for authentic look
- **Smooth Borders**: Rounded corners and professional styling
- **Perfect Text Rendering**: No broken or cut-off labels
- **Multiple Diagram Types**: Flowcharts, sequences, Gantt charts, and more
- **Theme Variety**: Classic (colorful) and Monochrome (monochrome) options

> **Try it yourself!** Copy any of these diagram codes into your Obsidian vault and see the Pretty Mermaid plugin transform them into beautiful, professional diagrams.