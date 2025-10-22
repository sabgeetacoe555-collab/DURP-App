drop policy "Group creators and admins can add members to groups" on "public"."group_members";

drop policy "Group creators and admins can remove members from groups" on "public"."group_members";

drop policy "Group creators and admins can update members of groups" on "public"."group_members";

drop function if exists "public"."can_manage_group"(group_id_param uuid);

drop function if exists "public"."is_group_creator"(group_id_param uuid);


  create policy "Users can add members to their groups"
  on "public"."group_members"
  as permissive
  for insert
  to public
with check ((group_id IN ( SELECT groups.id
   FROM groups
  WHERE (groups.user_id = auth.uid()))));



  create policy "Users can remove members from their groups"
  on "public"."group_members"
  as permissive
  for delete
  to public
using ((group_id IN ( SELECT groups.id
   FROM groups
  WHERE (groups.user_id = auth.uid()))));



  create policy "Users can update members of their groups"
  on "public"."group_members"
  as permissive
  for update
  to public
using ((group_id IN ( SELECT groups.id
   FROM groups
  WHERE (groups.user_id = auth.uid()))));



