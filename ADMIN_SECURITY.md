# Admin Panel Security

The admin panel is protected with PIN-based authentication and hidden from regular users.

## Setup

### 1. Generate Your Admin PIN Hash

Run the PIN hash generator:

```bash
node generate-admin-pin.js
```

Enter your desired 6-digit PIN when prompted. The script will output a SHA-256 hash.

### 2. Configure Environment Variable

Copy the generated hash and add it to your `.env` file:

```env
VITE_ADMIN_PIN_HASH=your_generated_hash_here
```

### 3. Restart Development Server

After updating the `.env` file, restart your development server for changes to take effect.

## Accessing Admin Panel

The admin panel is completely hidden from the UI. To access it:

**Press:** `Ctrl + Shift + A`

This will open the authentication modal where you can enter your 6-digit PIN.

## Security Features

### PIN Authentication
- 6-digit numeric PIN
- SHA-256 hashed for security
- Client-side verification using environment variable

### Session Management
- 1-hour session duration
- Stored in sessionStorage (cleared when browser closes)
- Auto-expires after inactivity

### Hidden Access
- No visible admin button for regular users
- Keyboard shortcut only (Ctrl+Shift+A)
- Authentication required on every new session

### Best Practices

1. **Keep your PIN secure** - Do not share it with unauthorized users
2. **Use a strong PIN** - Avoid simple sequences like 123456
3. **Rotate regularly** - Change your PIN periodically
4. **Don't commit** - Keep `.env` in `.gitignore` (already configured)

## Changing Your PIN

1. Run `node generate-admin-pin.js` again with new PIN
2. Update `VITE_ADMIN_PIN_HASH` in `.env`
3. Restart the development server

## Troubleshooting

### "Invalid PIN" Error
- Verify the hash in `.env` matches your PIN
- Ensure you've restarted the dev server after changing `.env`
- Check that you're entering the correct 6-digit PIN

### Can't Access Admin Panel
- Make sure keyboard shortcut is: `Ctrl + Shift + A`
- Check browser console for any errors
- Verify `VITE_ADMIN_PIN_HASH` is set in `.env`

### Session Expired
- Sessions last 1 hour
- Simply re-authenticate using the same PIN
- Sessions are cleared when browser is closed

## Security Notes

⚠️ **Important**: This is client-side authentication suitable for internal tools. For production applications with sensitive data, implement server-side authentication with proper user management.

The current implementation provides:
- Basic protection against casual access
- Hidden admin interface
- Session management
- PIN-based access control

It is **not** suitable for:
- Public-facing production applications
- Protecting highly sensitive data
- Multi-user admin systems
- Applications requiring audit trails
