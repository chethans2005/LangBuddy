import { useMutation, useQueryClient } from "@tanstack/react-query";
import { loginWithGoogle } from "../lib/api";

const useGoogleLogin = () => {
  const queryClient = useQueryClient();
  const { mutate, isPending, error } = useMutation({
    mutationFn: ({ idToken }) => loginWithGoogle(idToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["authUser"] }),
  });

  return { error, isPending, loginWithGoogleMutation: mutate };
};

export default useGoogleLogin;
