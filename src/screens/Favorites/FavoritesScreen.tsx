import React, { useState } from "react";
import AgoraUIKit from "agora-rn-uikit";
import { Text } from "react-native";
import { API_APP_ID_AGORA, API_CHANNEL_NAME_AGORA } from "@env";

const App = () => {
  const [videoCall, setVideoCall] = useState(true);
  const connectionData = {
    appId: API_APP_ID_AGORA,
    channel: API_CHANNEL_NAME_AGORA,
    token:
      "007eJxTYFh8I+aVu8mmoOWXc3MV1vEH/7HZUxpzdVnczRThh1z5v64qMFgaJJsZJ1pYGBmmJJokGadZmpuYmiebm6elmhubWSYZffQtS28IZGRYeceDmZEBAkF8DgZX9+DK4pLUXAYGADZmIj4=",
  };
  const rtcCallbacks = {
    EndCall: () => setVideoCall(false),
  };
  return videoCall ? (
    <AgoraUIKit connectionData={connectionData} rtcCallbacks={rtcCallbacks} />
  ) : (
    <Text onPress={() => setVideoCall(true)}>Start Call</Text>
  );
};

export default App;
