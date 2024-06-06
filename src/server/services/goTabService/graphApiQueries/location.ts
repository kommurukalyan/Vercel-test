import {
  getErrorResponse,
  getSuccessResponse,
} from '@/server/serverUtils/helpers';
import fetchGotabApi from '../api';
import { Address_Schema, Location_Schema } from '../graphApiSchema';

//Gotab's Location Query
export const getLocationQuery = `query LocationQuery($locationUuid: String!) {
  location(locationUuid: $locationUuid) {
     ${Location_Schema}
    address {
      ${Address_Schema}
    }
    }
}`;

//A method to fetch the Gotab LocationData
export const getLocation = async (locationUuid: string) => {
  const locationData = await fetchGotabApi(
    {
      query: getLocationQuery,
      variables: {
        locationUuid: locationUuid,
      },
    },
    'post',
  );
  const response = await locationData.json();
  return getSuccessResponse('Success', response?.data?.location);
};
