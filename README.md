
![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)
# PayFast Subscription API

Express.js API with TypeScript, designed to handle PayFast subscription payments and manage subscription data using Supabase. 

🔗 **Designed to work with [Payfast Subscription Client App](https://github.com/maseranw/payfast-sub-app)**
- You can get the database script on the client app.


## 📚 Table of Contents
- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#clone-the-repo)
- [Build & Dev](#️-build-the-project)
- [Database](#database)
- [API Endpoints](#-test-the-api-endpoints)
- [Environment Variables](#env-variables)
- [Contributing](#-contributing)
- [License](#-license)

## Features
- Integrates with PayFast for subscription payment processing.
- Manages subscription data with Supabase database.
- Implements TypeScript for type safety and scalability.
- Supports CORS for cross-origin requests.
- Includes error handling middleware.
- Deployable

## Prerequisites
- Node.js (v14 or higher)
- npm
- PayFast merchant account
- Supabase project with a `subscriptions` table


## Clone the repo
git clone https://github.com/maseranw/payfast-subscribe-api.git

## Navigate to the project directory
cd payfast-subscribe-api

## Install dependencies
npm install

## 🏗️ Build the Project
npm run build

## 🧪 Development Mode
To run TypeScript in watch mode:
npm run dev

## Database

```sql
/*
  Migration Summary Script
  ------------------------
  Combines all migrations for schema, policies, sample data, and triggers.
*/

/* 1. Create user_profiles table and RLS policies */
CREATE TABLE IF NOT EXISTS user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name text NOT NULL,
  last_name text NOT NULL,
  avatar_url text,
  phone text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON user_profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON user_profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

/* 2. Create subscription_features table and RLS policy */
CREATE TABLE IF NOT EXISTS subscription_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  feature_key text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view features"
  ON subscription_features
  FOR SELECT
  TO authenticated
  USING (true);

/* 3. Create subscription_plans table and RLS policy */
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price decimal(10,2) NOT NULL,
  currency text NOT NULL DEFAULT 'ZAR',
  billing_cycle text NOT NULL,
  features text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view plans"
  ON subscription_plans
  FOR SELECT
  TO authenticated
  USING (true);

/* 4. Create subscriptions table and RLS policies */
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE CASCADE NOT NULL,
  status text NOT NULL DEFAULT 'active',
  payfast_token text,
  cancel_at_period_end boolean DEFAULT false,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions"
  ON subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own subscriptions"
  ON subscriptions
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own subscriptions"
  ON subscriptions
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

/* 5. Create plan_features junction table and RLS policy */
CREATE TABLE IF NOT EXISTS plan_features (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id uuid REFERENCES subscription_plans(id) ON DELETE CASCADE NOT NULL,
  feature_id uuid REFERENCES subscription_features(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(plan_id, feature_id)
);

ALTER TABLE plan_features ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view plan features"
  ON plan_features
  FOR SELECT
  TO authenticated
  USING (true);

/* 6. Insert sample data: features, plans, and their relationships */
INSERT INTO subscription_features (name, feature_key) VALUES
  ('Reverse Text', 'reverse_text'),
  ('Emoji Blast', 'emoji_blast')
ON CONFLICT (feature_key) DO NOTHING;

INSERT INTO subscription_plans (name, price, currency, billing_cycle, features) VALUES
  ('Basic', 9.99, 'ZAR', 'monthly', ARRAY['reverse_text']),
  ('Pro', 19.99, 'ZAR', 'monthly', ARRAY['reverse_text', 'emoji_blast'])
ON CONFLICT DO NOTHING;

INSERT INTO plan_features (plan_id, feature_id)
SELECT p.id, f.id FROM subscription_plans p, subscription_features f
WHERE (p.name = 'Basic' AND f.feature_key = 'reverse_text')
   OR (p.name = 'Pro' AND f.feature_key IN ('reverse_text', 'emoji_blast'))
ON CONFLICT (plan_id, feature_id) DO NOTHING;

/* 7. Add payfast_subscription_id column to subscriptions table */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'payfast_subscription_id'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN payfast_subscription_id text;
    CREATE INDEX IF NOT EXISTS idx_subscriptions_payfast_subscription_id 
      ON subscriptions(payfast_subscription_id);
  END IF;
END $$;

/* 8. Add updated_at column and trigger to subscriptions table */
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'subscriptions' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE subscriptions ADD COLUMN updated_at timestamptz DEFAULT now();
  END IF;
END $$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON subscriptions;

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

/* 9. Create contact_messages table, RLS policies, indexes, and updated_at trigger */
CREATE TABLE IF NOT EXISTS contact_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  subject text NOT NULL,
  message text NOT NULL,
  priority text NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  user_email text NOT NULL,
  user_name text NOT NULL,
  admin_response text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own messages"
  ON contact_messages
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own messages"
  ON contact_messages
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own messages"
  ON contact_messages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_contact_messages_user_id ON contact_messages(user_id);
CREATE INDEX IF NOT EXISTS idx_contact_messages_status ON contact_messages(status);
CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at ON contact_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_contact_messages_priority ON contact_messages(priority);

CREATE OR REPLACE FUNCTION update_contact_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_contact_messages_updated_at
    BEFORE UPDATE ON contact_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_contact_messages_updated_at();

```

## 🔌 Test the API endpoints (e.g., using Postman or the frontend app):

| Method | Route                                        | Description                                   |
| ------ | -------------------------------------------- | --------------------------------------------- |
| POST   | `/api/payfast/initiate`                      | Generate PayFast payment data + URL           |
| POST   | `/api/payfast/notify`                        | Handle ITN (Instant Transaction Notification) |
| POST   | `/api/payfast/cancel/:token/:subscriptionId` | Cancel an active PayFast subscription         |
| POST   | `/api/payfast/cancel/:token`                 | Cancel an active PayFast subscription         |
| POST   | `/api/payfast/pause/:token`                  | Pause an active subscription                   |
| POST   | `/api/payfast/unpause/:token`                | Unpause a paused subscription                  |
| GET    | `/api/payfast/fetch/:token`                   | Fetch subscription details                      |


# Env variables

```env
PAYFAST_MERCHANT_ID=
PAYFAST_MERCHANT_KEY=
PAYFAST_PASSPHRASE=
PAYFAST_API_VERSION=v1
TESTING_MODE=true
NOTIFY_URL=
RETURN_URL=
CANCEL_URL=
NODE_ENV=
CLIENT_APP_URL=


SUPABASE_ANON_KEY=
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
```

## 👥 Maintainers

- [@ngelekanyo](https://github.com/maseranw) (author & maintainer)

## 🤝 Contributing

Contributions, suggestions, and issues welcome!  
Please open an issue or submit a pull request.

## 📄 License

This project is licensed under the MIT License.  
See the [LICENSE](./LICENSE) file for details.
