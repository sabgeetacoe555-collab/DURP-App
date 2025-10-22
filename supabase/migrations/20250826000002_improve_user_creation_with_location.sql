-- Improve user creation to handle location data and name during signup
-- Update the handle_new_user function to include name from user_metadata

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, name)
  VALUES (
    new.id, 
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', new.email)
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to update user location data
CREATE OR REPLACE FUNCTION public.update_user_location(
  user_id UUID,
  location_point GEOMETRY,
  location_address TEXT DEFAULT NULL,
  location_display_address TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET 
    location_point = update_user_location.location_point,
    location_address = update_user_location.location_address,
    location_display_address = update_user_location.location_display_address,
    location_updated_at = NOW(),
    updated_at = NOW()
  WHERE id = update_user_location.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add a function to update user profile data
CREATE OR REPLACE FUNCTION public.update_user_profile(
  user_id UUID,
  name TEXT DEFAULT NULL,
  phone TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
  UPDATE public.users 
  SET 
    name = COALESCE(update_user_profile.name, users.name),
    phone = COALESCE(update_user_profile.phone, users.phone),
    updated_at = NOW()
  WHERE id = update_user_profile.user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add RLS policy for the new functions
CREATE POLICY "Users can update their own location" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION public.update_user_location(UUID, GEOMETRY, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_user_profile(UUID, TEXT, TEXT) TO authenticated;
