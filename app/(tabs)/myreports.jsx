import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { auth, db } from '../../utils/firebase';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';
import { colors, typography, components, spacing } from '../../styles/theme';

export default function Myreports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  const user = auth.currentUser;

  useEffect(() => {
    const fetchReports = async () => {
      if (!user) return;
      try {
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          const myReports = data.myreports || [];

          // Process each report string
          const results = await Promise.all(
            myReports.map(async (item) => {
              const [orgId, reportId] = item.split('\\');
              try {
                const res = await axios.post('https://zymono-225ehrdsq-zymono.vercel.app/api/checkReport', {
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

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading reports...</Text>
      </View>
    );
  }

  if (reports.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>No reports found.</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>My Reports</Text>

      {reports.map((r, index) => (
        <View
          key={`${r.orgId}-${r.reportId}-${index}`}
          style={[
            styles.card,
            r.status === 'Pending' ? styles.pendingCard : styles.reviewedCard,
          ]}
        >
          <Text style={styles.cardTitle}>Report ID: {r.reportId}</Text>
          <Text style={styles.cardText}>
            <Text style={{fontWeight: '600'}}>Reason: </Text>
            {r.data?.reason || "Report data not available as this report has been completed"}
          </Text>
          <Text style={[styles.statusText, { 
            color: r.status === 'Pending' ? colors.warning : colors.success 
          }]}>
            Status: {r.status === 'Pending' ? 'Pending' : 'Reviewed'}
          </Text>
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    ...components.container,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  title: {
    ...typography.h3,
    marginBottom: spacing.xl,
    textAlign: 'center',
  },
  card: {
    ...components.card,
    marginBottom: spacing.md,
    borderWidth: 1,
  },
  pendingCard: {
    backgroundColor: '#fff8e1',
    borderColor: colors.warning,
  },
  reviewedCard: {
    backgroundColor: '#f3f8f3',
    borderColor: colors.success,
  },
  cardTitle: {
    ...typography.h5,
    marginBottom: spacing.sm,
    color: colors.textPrimary,
  },
  cardText: {
    ...typography.body1,
    marginBottom: spacing.xs,
    color: colors.textSecondary,
  },
  statusText: {
    ...typography.body2,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  loadingText: {
    ...typography.body1,
    color: colors.textSecondary,
    marginTop: spacing.md,
  },
  emptyText: {
    ...typography.body1,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
