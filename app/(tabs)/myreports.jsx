import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  useColorScheme,
} from 'react-native';
import { auth, db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';
import { colors, typography, components, spacing } from '../../styles/theme';

export default function Myreports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const colorScheme = useColorScheme(); // 👈 Detect system theme

  const user = auth.currentUser;

  const isDark = colorScheme === 'dark';

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const myReports = data.myreports || [];

          const results = await Promise.all(
            myReports.map(async (item) => {
              const [orgId, reportId] = item.split('\\');
              try {
                const res = await axios.post('https://zymono.com/api/checkReport', {
                  org: orgId,
                  report: reportId,
                });
                return {
                  orgId,
                  reportId,
                  data: res.data.data,
                  status: res.data.status,
                };
              } catch (err) {
                return {
                  orgId,
                  reportId,
                  status: 'error',
                };
              }
            })
          );

          setReports(results);
        }
      } catch (error) {
        console.error('Error fetching reports:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, [user]);

  const themedStyles = styles(isDark); // 👈 use function-based styles

  if (loading) {
    return (
      <View style={themedStyles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={themedStyles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={themedStyles.center}>
        <Text style={themedStyles.emptyText}>No reports found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={themedStyles.container}>
      <Text style={themedStyles.title}>My Reports</Text>

      {reports.map((r, index) => (
        <View
          key={`${r.orgId}-${r.reportId}-${index}`}
          style={[
            themedStyles.card,
            r.status === 'Pending'
              ? themedStyles.pendingCard
              : themedStyles.reviewedCard,
          ]}
        >
          <Text style={themedStyles.cardTitle}>Report ID: {r.reportId}</Text>
          <Text style={themedStyles.cardText}>
            <Text style={{ fontWeight: '600' }}>Reason: </Text>
            {r.data?.reason ||
              'Report data not available as this report has been completed'}
          </Text>
          <Text
            style={[
              themedStyles.statusText,
              {
                color:
                  r.status === 'Pending'
                    ? colors.warning
                    : colors.success,
              },
            ]}
          >
            Status: {r.status === 'Pending' ? 'Pending' : 'Reviewed'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = (isDark) =>
  StyleSheet.create({
    container: {
      ...components.container,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    center: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 50,
      backgroundColor: isDark ? '#000' : '#fff',
    },
    title: {
      ...typography.h3,
      marginTop: 50,
      marginBottom: spacing.xl,
      textAlign: 'center',
      color: isDark ? '#fff' : colors.textPrimary,
    },
    card: {
      ...components.card,
      marginBottom: spacing.md,
      borderWidth: 1,
      backgroundColor: isDark ? '#1c1c1e' : '#fff',
      borderColor: isDark ? '#333' : '#ccc',
    },
    pendingCard: {
      backgroundColor: isDark ? '#3a2e00' : '#fff8e1',
      borderColor: colors.warning,
    },
    reviewedCard: {
      backgroundColor: isDark ? '#1a2e1a' : '#f3f8f3',
      borderColor: colors.success,
    },
    cardTitle: {
      ...typography.h5,
      marginBottom: spacing.sm,
      color: isDark ? '#fff' : colors.textPrimary,
    },
    cardText: {
      ...typography.body1,
      marginBottom: spacing.xs,
      color: isDark ? '#ccc' : colors.textSecondary,
    },
    statusText: {
      ...typography.body2,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    loadingText: {
      ...typography.body1,
      color: isDark ? '#bbb' : colors.textSecondary,
      marginTop: spacing.md,
    },
    emptyText: {
      ...typography.body1,
      color: isDark ? '#bbb' : colors.textSecondary,
      textAlign: 'center',
    },
  });
