# Admin Panel Security

The admin panel uses email/password authentication powered by Supabase Auth. Access is completely hidden from regular users and requires authentication.

## Accessing Admin Panel

The admin panel is hidden from the UI. To access it:

**Press:** `Ctrl + Shift + A`

This will open the authentication modal where you can login or create an admin account.

## First-Time Setup

### Creating the First Admin Account

1. Press `Ctrl + Shift + A` to open the admin authentication modal
2. Click "Create one" to switch to signup mode
3. Enter your email address
4. Enter a password (minimum 6 characters)
5. Confirm your password
6. Click "Create Account"

The first admin account can be created by anyone. After that, only existing admins can create new admin accounts (if needed in the future).

## Logging In

1. Press `Ctrl + Shift + A`
2. Enter your email and password
3. Click "Login"

## Security Features

### Email/Password Authentication
- Powered by Supabase Auth
- Secure password hashing
- Minimum 6-character password requirement
- Password confirmation on signup

### Admin Authorization
- Separate `admin_users` table tracks admin status
- Only users in `admin_users` table can access admin panel
- Admin status can be revoked by deactivating accounts
- Row Level Security (RLS) policies protect admin data

### Session Management
- 1-hour session duration
- Stored in sessionStorage (cleared when browser closes)
- Auto-expires after inactivity
- Proper logout clears session and signs out

### Hidden Access
- No visible admin button for regular users
- Keyboard shortcut only (Ctrl+Shift+A)
- Authentication required on every new session
- Automatic sign-out on exit

## Admin Management

### Admin User Table
The `admin_users` table stores:
- `id` - User ID from Supabase Auth
- `email` - Admin email address
- `created_at` - When admin was added
- `created_by` - Which admin created this user
- `is_active` - Whether admin account is active

### Deactivating Admin Access
To revoke admin access, update the `is_active` field to `false` in the `admin_users` table. The user will be unable to access the admin panel on their next login attempt.

## Security Best Practices

1. **Use strong passwords** - Minimum 6 characters with mix of letters, numbers, and symbols
2. **Keep credentials secure** - Do not share your admin login credentials
3. **Regular reviews** - Periodically review admin user list and deactivate unused accounts
4. **Session awareness** - Always exit admin panel when done (auto signs out)
5. **Monitor access** - Track `created_by` field to audit admin account creation

## Troubleshooting

### "Access denied" Error
- Verify your account exists in the `admin_users` table
- Check that `is_active` is set to `true`
- Ensure you're using the correct email/password

### Can't Access Admin Panel
- Make sure keyboard shortcut is: `Ctrl + Shift + A`
- Check browser console for any errors
- Verify Supabase connection is working

### Session Expired
- Sessions last 1 hour
- Simply log in again using the same credentials
- Sessions are cleared when browser is closed

### Password Reset
Currently, password reset is handled through Supabase Auth. You can implement password reset functionality by:
1. Using Supabase's built-in password reset flow
2. Adding a "Forgot Password" link in the auth modal
3. Configuring email templates in Supabase dashboard

## Database Schema

```sql
CREATE TABLE admin_users (
  id uuid PRIMARY KEY REFERENCES auth.users(id),
  email text UNIQUE NOT NULL,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES admin_users(id),
  is_active boolean DEFAULT true
);
```

## Row Level Security Policies

1. **View Access** - Only active admins can view admin_users table
2. **First Admin Creation** - Anyone can create first admin (bootstrap)
3. **Admin Creation** - Only existing active admins can create new admins
4. **Admin Updates** - Only active admins can update admin records

## Technical Implementation

- **Frontend Authentication**: React component with email/password forms
- **Backend**: Supabase Auth handles user authentication
- **Authorization**: Custom `admin_users` table for admin role tracking
- **Session Storage**: Browser sessionStorage for 1-hour sessions
- **RLS Protection**: Comprehensive policies protect admin data

## Future Enhancements

Consider implementing:
- Password reset functionality
- Two-factor authentication (2FA)
- Admin activity logging
- Email verification on signup
- Admin role permissions (super admin, regular admin, etc.)
