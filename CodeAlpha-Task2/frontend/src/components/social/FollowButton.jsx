import { useEffect, useState } from "react";
import { getApiErrorMessage } from "../../api/axios.js";
import useToast from "../../hooks/useToast.js";
import userService from "../../services/userService.js";
import Button from "../common/Button.jsx";

/* Follow / unfollow. The button shows what the server says, and reports the new follower count via onChange. */
export default function FollowButton({ userId, name, initialFollowing, onChange }) {
  const toast = useToast();
  const [following, setFollowing] = useState(initialFollowing);
  const [busy, setBusy] = useState(false);

  useEffect(() => setFollowing(initialFollowing), [initialFollowing]);

  const toggle = async () => {
    setBusy(true);
    try {
      const result = following ? await userService.unfollow(userId) : await userService.follow(userId);
      setFollowing(result.following);
      onChange?.(result);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Could not update follow status."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button variant={following ? "secondary" : "primary"} loading={busy} aria-pressed={following} aria-label={`Follow ${name}`} onClick={toggle}>
      {following ? "Following" : "Follow"}
    </Button>
  );
}
