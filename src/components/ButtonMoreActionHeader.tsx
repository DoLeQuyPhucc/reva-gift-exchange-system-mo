import React, { useEffect, useState } from "react";
import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { useNavigation } from "../hooks/useNavigation";

interface ButtonMoreActionHeaderProps {
  propNav: "Home" | "Favorites" | "Notifications" | "Profile";
}

export function ButtonMoreActionHeader({ propNav }: ButtonMoreActionHeaderProps) {
    const navigation = useNavigation();
  return (
    <MaterialIcons name="more-vert" size={24} color="black" style={{marginRight: 20}} 
          onPress={() => navigation.navigate("Main", {screen: `${propNav}`})}/>
  );
}
