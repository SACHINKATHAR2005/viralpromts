# Project Setup Instruction for Copilot

You are building the frontend for **Viral Prompts** — a full-stack app where users can share, discover, and monetize AI prompts.

## Step 1: Backend Scanning and Understanding
1. Scan all backend files (routes, models, controllers, and validators).
2. Identify available API endpoints:
   - `/prompt` → CRUD routes for prompts
   - `/collection` → for saved boards
   - `/user` → for profiles and social activity
   - `/auth` → for signup, login, logout
   - `/feed` → for social activity feed
3. Extract the expected request/response schemas and types.
4. Auto-generate a `types.ts` file in the `src/types/` folder containing TypeScript interfaces for all data models.
5. Create an `api/ApiClient.ts` utility wrapping all endpoints with proper validation.

## Step 2: Global Setup
- Create a new Next.js 15 app (with App Router) using TypeScript + TailwindCSS + Shadcn/UI.
- Configure metadata generation (`generateMetadata`) for each dynamic route using Next.js SEO utilities.
- Integrate Zustand for global state management.
- Set up cookie-based authentication with `axios` (`withCredentials: true`).

## Step 3: Pages & Components (Design Inspirations Included)

### 1️⃣ Home / Discovery Feed (Pinterest-Inspired)
- Grid-based responsive layout for displaying prompts.
- Infinite scroll or pagination.
- Filters by category/tags.
- Hover preview (title + likes + creator).
- Dynamic meta: 
  - `title`: "Viral Prompts – Discover Trending AI Prompts"
  - `description`: "Browse creative and viral AI prompts shared by top creators."

### 2️⃣ Prompt Detail Page (Medium-Inspired)
- Full prompt view (title, description, tags, likes, saves, comments).
- Creator info card (avatar, bio, link to profile).
- Related prompts section below.
- Dynamic meta based on prompt:
  - `title`: `${prompt.title} – Viral Prompts`
  - `description`: `${prompt.description.slice(0, 150)}...`
  - `image`: `${prompt.imageUrl}`

### 3️⃣ User Profile (GitHub-Inspired)
- Header: avatar, username, follower/following count.
- Tabs: Prompts | Collections | Activity
- Dynamic meta:
  - `title`: `${user.username} – Viral Prompts Profile`
  - `description`: `${user.bio || "AI Creator on Viral Prompts"}`

### 4️⃣ Create/Edit Prompt Page (Notion-Inspired)
- Editor-style UI for creating prompts.
- Inputs for title, description, category, tags, image, price (if monetized).
- Preview card in real-time.
- Auto-save draft logic.
- Dynamic meta:
  - `title`: "Create a Prompt – Viral Prompts"
  - `description`: "Write and publish your best AI prompt."

### 5️⃣ Collections / Saved (Pinterest Boards)
- Board-style layout showing user’s saved or grouped prompts.
- Option to create new boards.
- Dynamic meta:
  - `title`: "My Collections – Viral Prompts"
  - `description`: "Organize and save your favorite AI prompts."

### 6️⃣ Social Feed (Twitter-Inspired)
- Show updates from followed users (new prompt posted, liked, saved, commented).
- Comment + like + repost buttons.
- Dynamic meta:
  - `title`: "Social Feed – Viral Prompts"
  - `description`: "Stay updated with what your favorite creators are sharing."

## Step 4: Reusable Components
- `PromptCard`
- `UserAvatar`
- `PromptGrid`
- `MetaTags` (for dynamic SEO)
- `CommentSection`
- `LikeButton`, `SaveButton`, `ShareMenu`
- `LoadingSkeleton`
- `PaginationControls`

## Step 5: Meta System
For every page, implement:
```ts
export async function generateMetadata({ params }): Promise<Metadata> {
  const data = await fetchDataForThisPage();
  return {
    title: data.title || "Viral Prompts",
    description: data.description || "Share and discover AI prompts.",
    openGraph: {
      title: data.title,
      description: data.description,
      images: [data.image || defaultImage],
    },
  };
}
