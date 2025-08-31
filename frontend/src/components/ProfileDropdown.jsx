import { Link } from "react-router-dom";
import useAuthUser from "../hooks/useAuthUser";

const ProfileDropdown = () => {
  const { authUser } = useAuthUser();
  if (!authUser) return null;

  return (
    <div className="dropdown dropdown-end">
      <div tabIndex={0} role="button" className="avatar w-9 h-9 rounded-full cursor-pointer">
        <img
          src={authUser.profilePic || `https://api.dicebear.com/7.x/bottts/svg?seed=default`}
          alt={authUser.fullName}
          className="w-9 h-9 rounded-full object-cover"
        />
      </div>
      <ul
        tabIndex={0}
        className="dropdown-content z-[1] menu p-2 shadow bg-base-200 rounded-box w-52"
      >
        <li className="flex items-center gap-2 mb-1">
          <span className="font-medium truncate">{authUser.fullName}</span>
        </li>
        <li>
          <span className="text-xs">
            <b>Location:</b> {authUser.location || "Not set"}
          </span>
        </li>
        <li>
          <span className="text-xs">
            <b>Native:</b> {authUser.nativeLanguage || "Not set"}
          </span>
        </li>
        <li>
          <span className="text-xs">
            <b>Learning:</b> {authUser.learningLanguage || "Not set"}
          </span>
        </li>
        <li className="mt-2">
          <Link to="/profile/edit" className="btn btn-primary btn-xs w-full">
            Edit Profile
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default ProfileDropdown;