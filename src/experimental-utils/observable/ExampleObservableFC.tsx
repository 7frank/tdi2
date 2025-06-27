import type { Inject } from "../../di/markers";
import type { ApiService, UserService } from "./exampleServices";
import { useObservableState } from "./useObservableState";

export function ExampleObservableFC({
  services: { apiService, userService },
}: {
  services: {
    apiService: Inject<ApiService>;
    userService: Inject<UserService>;
  };
}) {
  const apiState = useObservableState(apiService);
  const userState = useObservableState(userService);

  const handleApiCall = async () => {
    await apiService.fetchData();
  };

  const handleUserFetch = async () => {
    await userService.getProfile("123");
  };

  const renderApiState = () => {
    if (apiState.isLoading) return <div>Loading API data...</div>;
    if (apiState.isError) return <div>Error: {apiState.error?.message}</div>;
    if (apiState.isSuccess) return <div>✅ {apiState.data}</div>;
    return <div>Ready to fetch API data</div>;
  };

  const renderUserState = () => {
    if (userState.isLoading) return <div>Loading user...</div>;
    if (userState.isError) return <div>Error: {userState.error?.message}</div>;
    if (userState.isSuccess)
      return (
        <div>
          ✅ {userState.data?.name} ({userState.data?.email})
        </div>
      );
    return <div>Ready to fetch user</div>;
  };

  return (
    <>
      <div>
        <button onClick={handleApiCall}>Fetch API Data</button>
        {renderApiState()}
      </div>

      <div style={{ marginTop: "20px" }}>
        <button onClick={handleUserFetch}>Fetch User</button>
        {renderUserState()}
      </div>

      <div style={{ marginTop: "20px", fontSize: "12px", color: "#666" }}>
        <div>API State: {JSON.stringify(apiState, null, 2)}</div>
        <div>User State: {JSON.stringify(userState, null, 2)}</div>
      </div>
    </>
  );
}
